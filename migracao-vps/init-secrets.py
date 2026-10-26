#!/usr/bin/env python3
"""Cria credenciais locais uma única vez; nunca as exibe no terminal."""
from pathlib import Path
import os
import secrets

path = Path(__file__).resolve().parent / '.env'
values = {
    'ZP_DB_PASSWORD': secrets.token_hex(32),
    'ZP_WUZ_ADMIN_TOKEN': secrets.token_hex(32),
    'ZP_WUZ_ENCRYPTION_KEY': secrets.token_hex(16),
}
try:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    raise SystemExit('As credenciais já existem; nenhuma foi alterada.')
with os.fdopen(fd, 'w', encoding='utf-8') as f:
    for key, value in values.items():
        f.write(f'{key}={value}\\n')
print('Credenciais locais criadas com acesso restrito.')
