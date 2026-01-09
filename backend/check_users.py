#!/usr/bin/env python3
"""Script para verificar usuarios en la base de datos"""
import sqlite3
import os
import sys

def check_users():
    # Buscar la base de datos
    db_path = "horarios.db"
    if not os.path.exists(db_path):
        print("❌ No se encontró la base de datos horarios.db")
        print("📁 Archivos en directorio:", os.listdir('.'))
        return
    
    print(f"✅ Conectando a la base de datos: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si existe la tabla users
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ La tabla 'users' no existe")
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print("📊 Tablas disponibles:", [table[0] for table in tables])
        else:
            print("✅ Tabla 'users' encontrada")
            cursor.execute("SELECT username, email, full_name, role, is_active, id FROM users")
            users = cursor.fetchall()
            
            if not users:
                print("📭 No hay usuarios en la base de datos")
            else:
                print("\n👥 USUARIOS EN LA BASE DE DATOS:")
                print("=" * 60)
                for user in users:
                    print(f"🆔 ID: {user[5]}")
                    print(f"👤 Username: {user[0]}")
                    print(f"📧 Email: {user[1]}")
                    print(f"📋 Nombre completo: {user[2]}")
                    print(f"🎭 Rol: {user[3]}")
                    print(f"✅ Activo: {'Sí' if user[4] else 'No'}")
                    print("-" * 40)
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error al conectar a la base de datos: {e}")

if __name__ == "__main__":
    check_users()