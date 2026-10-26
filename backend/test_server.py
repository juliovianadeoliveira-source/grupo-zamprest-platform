import http.client
import json
import os
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer

import server

class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory(); server.DB=os.path.join(cls.tmp.name,'test.sqlite3'); server.initialize()
        server.create_admin('a@example.com','senha-forte-1234'); server.create_admin('b@example.com','senha-forte-5678')
        cls.http=ThreadingHTTPServer(('127.0.0.1',0),server.Handler);cls.port=cls.http.server_port
        threading.Thread(target=cls.http.serve_forever,daemon=True).start()
    @classmethod
    def tearDownClass(cls): cls.http.shutdown();cls.http.server_close();cls.tmp.cleanup()
    def request(self,method,path,data=None,cookie=None,origin=server.ALLOWED_ORIGIN):
        conn=http.client.HTTPConnection('127.0.0.1',self.port,timeout=5); headers={}
        if data is not None: data=json.dumps(data);headers.update({'Content-Type':'application/json','Origin':origin})
        if cookie:headers['Cookie']=cookie
        conn.request(method,path,body=data,headers=headers);response=conn.getresponse();body=json.loads(response.read());cookie=response.getheader('Set-Cookie');status=response.status;conn.close();return status,body,cookie
    def login(self,email,password):
        code,_,cookie=self.request('POST','/login',{'email':email,'password':password});self.assertEqual(code,200);return cookie.split(';')[0]
    def test_auth_tenant_separation_and_crm(self):
        self.assertEqual(self.request('GET','/companies')[0],401)
        self.assertEqual(self.request('POST','/login',{'email':'a@example.com','password':'errada'})[0],401)
        a=self.login('a@example.com','senha-forte-1234');b=self.login('b@example.com','senha-forte-5678')
        self.assertEqual(self.request('POST','/companies',{'name':'Outra'},a,origin='https://other.example')[0],403)
        status,obj,_=self.request('POST','/companies',{'name':'Empresa A'},a);self.assertEqual(status,201);cid=obj['id']
        status,obj,_=self.request('POST',f'/companies/{cid}/customers',{'name':'Ana','phone':'27999999999','environment':'secador de café'},a);self.assertEqual(status,201);customer=obj['id']
        self.assertEqual(self.request('GET',f'/companies/{cid}/customers',cookie=b)[0],404)
        self.assertEqual(self.request('POST',f'/companies/{cid}/appointments',{'title':'Visita','starts_at':'2026-11-03T10:00:00','customer_id':customer},a)[0],201)
        self.assertEqual(self.request('POST',f'/companies/{cid}/work-orders',{'description':'Instalação','customer_id':customer},a)[0],201)
        status,data,_=self.request('GET',f'/companies/{cid}/customers',cookie=a);self.assertEqual(data['items'][0]['environment'],'secador de café')
        self.assertEqual(self.request('POST','/logout',{},a)[0],200);self.assertEqual(self.request('GET','/companies',cookie=a)[0],401)

if __name__=='__main__':unittest.main()
