# -*- coding: utf-8 -*-
"""
Date: 24.11.2020

Created by: Tim Hager

Description:
    Prints the name of the tables, their description and the contained items
    in the terminal.
    Used to get the information about the established database.
"""

### Imports 
import mysql.connector as mysql_connector
import _env


### Create connection with database
try:
    db = mysql_connector.connect(
            user=_env.DB_USER,
            password=_env.DB_PASSWORD,
            host=_env.DB_HOST,
            database=_env.DB_NAME,
            # Necessary for mysql 8.0 to avoid an error because of encoding
            auth_plugin='mysql_native_password'
        )
except:
    db = mysql_connector.connect(
            user=_env.DB_USER,
            password=_env.DB_PASSWORD,
            host="127.0.0.1",
            database=_env.DB_NAME,
            # Necessary for mysql 8.0 to avoid an error because of encoding
            auth_plugin='mysql_native_password'
        )
    

# Create execution object
cursor = db.cursor()
cursor.execute("SHOW TABLES")
tables = cursor.fetchall()


### Get all tables and print the name of the tables as well as their description and items
for (table, ) in tables:
    print(table + ":")
    print("\nDescription:")
    cursor.execute("DESCRIBE " + table)
    for column in cursor:
        print(column)
    print("\nItems:")
    cursor.execute("SELECT * FROM "+table)
    for item in cursor:
        print(item)
    print("\n\n")
    


### Close the connection
cursor.close()
db.close()