import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления комбинациями: получение списка, добавление новых комбинаций, удаление всех записей'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            cur.execute('''
                SELECT id, numbers, date::text, created_at::text
                FROM combinations
                ORDER BY date DESC, id DESC
            ''')
            rows = cur.fetchall()
            
            combinations = []
            for row in rows:
                combinations.append({
                    'id': row['id'],
                    'numbers': row['numbers'],
                    'date': row['date']
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'combinations': combinations}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            numbers = body.get('numbers', [])
            date = body.get('date', datetime.now().strftime('%Y-%m-%d'))
            
            if not isinstance(numbers, list) or len(numbers) != 5:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Numbers must be an array of 5 integers'}),
                    'isBase64Encoded': False
                }
            
            for num in numbers:
                if not isinstance(num, int) or num < 1 or num > 45:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Each number must be between 1 and 45'}),
                        'isBase64Encoded': False
                    }
            
            cur.execute('''
                INSERT INTO combinations (numbers, date)
                VALUES (%s, %s)
                RETURNING id, numbers, date::text
            ''', (numbers, date))
            
            row = cur.fetchone()
            conn.commit()
            
            result = {
                'id': row['id'],
                'numbers': row['numbers'],
                'date': row['date']
            }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            cur.execute('DELETE FROM combinations')
            deleted_count = cur.rowcount
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': f'Deleted {deleted_count} combinations'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
