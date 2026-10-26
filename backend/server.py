"""Grupo Zamprest: backend inicial, sem dependências externas.

Servidor para desenvolvimento local. Produção exige HTTPS, proxy confiável,
armazenamento persistente e uma revisão de segurança antes da publicação.
"""
import argparse
import datetime as dt
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

DB = os.environ.get('ZAMPREST_DB', 'zamprest.sqlite3')
PORT = int(os.environ.get('PORT', '8080'))
ALLOWED_ORIGIN = os.environ.get('ZAMPREST_ORIGIN', 'http://127.0.0.1:8080')
COOKIE_SECURE = os.environ.get('ZAMPREST_SECURE_COOKIE', '0') == '1'

SCHEMA = '''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt BLOB NOT NULL, password_hash BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash BLOB PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS companies(id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id), name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', reference TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', environment TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id), customer_id INTEGER, title TEXT NOT NULL, starts_at TEXT NOT NULL, technician TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS work_orders(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id), customer_id INTEGER, appointment_id INTEGER, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'aberta', technician TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(customer_id) REFERENCES customers(id), FOREIGN KEY(appointment_id) REFERENCES appointments(id));
CREATE INDEX IF NOT EXISTS customers_company ON customers(company_id, name);
CREATE INDEX IF NOT EXISTS appointments_company ON appointments(company_id, starts_at);
CREATE INDEX IF NOT EXISTS orders_company ON work_orders(company_id, created_at);
'''

def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db

def initialize():
    with connect() as db: db.executescript(SCHEMA)

def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)

def create_admin(email, password):
    if len(password) < 12: raise ValueError('A senha deve ter pelo menos 12 caracteres.')
    salt = secrets.token_bytes(16)
    with connect() as db:
        db.execute('INSERT INTO accounts(email,salt,password_hash) VALUES (?,?,?)', (email.strip().lower(), salt, password_hash(password, salt)))

def clean(value, limit=500):
    if not isinstance(value, str): raise ValueError('Texto inválido.')
    value = value.strip()
    if len(value) > limit: raise ValueError('Texto muito longo.')
    return value

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def respond(self, status, payload, headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        for key, value in (headers or {}).items(): self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get('Content-Length', '0'))
        if n <= 0 or n > 32768: raise ValueError('Tamanho de pedido inválido.')
        data = json.loads(self.rfile.read(n))
        if not isinstance(data, dict): raise ValueError('Dados inválidos.')
        return data

    def identity(self, db):
        jar = cookies.SimpleCookie()
        try: jar.load(self.headers.get('Cookie', ''))
        except cookies.CookieError: return None
        token = jar.get('zp_session')
        if not token: return None
        digest = hashlib.sha256(token.value.encode()).digest()
        row = db.execute('SELECT account_id FROM sessions WHERE token_hash=? AND expires_at > ?', (digest, int(dt.datetime.now(dt.timezone.utc).timestamp()))).fetchone()
        return row['account_id'] if row else None

    def authorized_company(self, db, user, cid):
        return db.execute('SELECT id FROM companies WHERE id=? AND account_id=?', (cid, user)).fetchone() is not None

    def owned_customer(self, db, cid, customer):
        return customer is None or db.execute('SELECT id FROM customers WHERE id=? AND company_id=?', (customer, cid)).fetchone() is not None

    def do_GET(self): self.handle_request('GET')
    def do_POST(self): self.handle_request('POST')

    def handle_request(self, method):
        try:
            path = urlparse(self.path).path.rstrip('/') or '/'
            if method == 'POST' and self.headers.get('Origin') != ALLOWED_ORIGIN:
                return self.respond(403, {'error':'Origem não autorizada.'})
            with connect() as db:
                if path == '/health' and method == 'GET': return self.respond(200, {'status':'ok'})
                if path == '/login' and method == 'POST':
                    data = self.body(); email = clean(data.get('email',''), 254).lower(); password = data.get('password','')
                    if not isinstance(password, str) or len(password) > 1024: raise ValueError('Credenciais inválidas.')
                    account = db.execute('SELECT * FROM accounts WHERE email=?', (email,)).fetchone()
                    salt = account['salt'] if account else bytes(16)
                    hashed = password_hash(password, salt)
                    if not account or not hmac.compare_digest(hashed, account['password_hash']): return self.respond(401, {'error':'Credenciais inválidas.'})
                    token = secrets.token_urlsafe(32); digest=hashlib.sha256(token.encode()).digest()
                    db.execute('INSERT INTO sessions VALUES(?,?,?)', (digest, account['id'], int(dt.datetime.now(dt.timezone.utc).timestamp())+28800))
                    cookie='zp_session='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800'+('; Secure' if COOKIE_SECURE else '')
                    return self.respond(200, {'ok':True}, {'Set-Cookie':cookie})
                user = self.identity(db)
                if not user: return self.respond(401, {'error':'Faça login para continuar.'})
                if path == '/logout' and method == 'POST':
                    jar=cookies.SimpleCookie(); jar.load(self.headers.get('Cookie','')); token=jar.get('zp_session')
                    if token: db.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(token.value.encode()).digest(),))
                    return self.respond(200, {'ok':True}, {'Set-Cookie':'zp_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'})
                if path == '/companies':
                    if method == 'GET': return self.respond(200, {'items':[dict(x) for x in db.execute('SELECT id,name,created_at FROM companies WHERE account_id=? ORDER BY name',(user,))]})
                    data=self.body(); name=clean(data.get('name',''),120)
                    if not name: raise ValueError('Informe o nome da empresa.')
                    cur=db.execute('INSERT INTO companies(account_id,name) VALUES(?,?)',(user,name));return self.respond(201, {'id':cur.lastrowid})
                parts=path.strip('/').split('/')
                if len(parts)!=3 or parts[0]!='companies' or parts[2] not in ('customers','appointments','work-orders'): return self.respond(404, {'error':'Rota não encontrada.'})
                cid=int(parts[1]); resource=parts[2]
                if not self.authorized_company(db,user,cid): return self.respond(404, {'error':'Empresa não encontrada.'})
                table={'customers':'customers','appointments':'appointments','work-orders':'work_orders'}[resource]
                if method=='GET': return self.respond(200, {'items':[dict(x) for x in db.execute('SELECT * FROM '+table+' WHERE company_id=? ORDER BY id DESC LIMIT 500',(cid,))]})
                data=self.body()
                if resource=='customers':
                    cols=['name','phone','email','address','reference','location','environment','notes']; vals=[clean(data.get(k,''),2000 if k=='notes' else 500) for k in cols]
                    if not vals[0]: raise ValueError('Informe o nome do cliente.')
                else:
                    customer=data.get('customer_id'); customer=int(customer) if customer else None
                    if not self.owned_customer(db,cid,customer): raise ValueError('Cliente não pertence a esta empresa.')
                    if resource=='appointments':
                        cols=['customer_id','title','starts_at','technician','notes']; vals=[customer,clean(data.get('title',''),160),clean(data.get('starts_at',''),40),clean(data.get('technician',''),120),clean(data.get('notes',''),2000)]
                        if not vals[1] or not vals[2]: raise ValueError('Informe compromisso e data.')
                        dt.datetime.fromisoformat(vals[2].replace('Z','+00:00'))
                    else:
                        cols=['customer_id','description','technician']; vals=[customer,clean(data.get('description',''),2000),clean(data.get('technician',''),120)]
                        if not vals[1]: raise ValueError('Informe o serviço.')
                cur=db.execute('INSERT INTO '+table+'(company_id,'+','.join(cols)+') VALUES('+','.join('?' for _ in range(len(cols)+1))+')',[cid]+vals)
                return self.respond(201, {'id':cur.lastrowid})
        except (ValueError, TypeError, json.JSONDecodeError): return self.respond(400, {'error':'Dados inválidos. Confira os campos e tente novamente.'})
        except sqlite3.Error: return self.respond(500, {'error':'Erro ao acessar o banco de dados.'})

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--create-admin',metavar='EMAIL');args=parser.parse_args(); initialize()
    if args.create_admin:
        import getpass
        password=getpass.getpass('Senha inicial: '); confirmation=getpass.getpass('Confirme a senha: ')
        if password != confirmation: raise SystemExit('As senhas não coincidem.')
        create_admin(args.create_admin,password); print('Administrador criado.')
    else:
        print(f'API em http://127.0.0.1:{PORT}');ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
