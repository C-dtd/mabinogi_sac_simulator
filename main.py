from flask import *
from os import path, environ
import requests
import re
import json
import datetime
import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

tz_utc = datetime.timezone.utc
root = path.dirname(path.realpath('shop_data.json'))
shopfilepath = path.join(root, 'shop_data.json')
colorfilepath = path.join(root, 'color_map.json')

p01 = re.compile('(?<=4b45)(.*?)(?=87464e)')
p02 = re.compile('(?<=87464e)(.*?)(?=8a5042)')
p03 = re.compile('(?<=8a5042)(.*?)(?=844350)')

def sac_data(shop_list):
    tab_list = [i['tab_name'] for i in shop_list['shop']]
    if '주머니' in tab_list:
        return tab_list.index('주머니')
    else:
        return -1

def get_shop_list(npc_name, server_name, channel):
    urlString = f"https://open.api.nexon.com/mabinogi/v1/npcshop/list?npc_name={npc_name}&server_name={server_name}&channel={channel}"
    response = requests.get(urlString, headers = headers)
    return response.json()

def get_sac_colorcode(shop_list):
    sac_list = shop_list['item']
    return {
        i['item_display_name']: {
            'image': i['image_url'], 
            'color': [
                color_decode(p01.findall(i['image_url'])[0], 'A'), 
                color_decode(p02.findall(i['image_url'])[0], 'B'), 
                color_decode(p03.findall(i['image_url'])[0], 'C'), 
            ]
        } for i in sac_list
    }

def color_decode(c, p):
    c = [int(c[:4], 16), int(c[4:8], 16), int(c[8:12], 16)]
    if p not in color_map:
        return False
    if c[0] not in color_map[p]['r']: return False
    if c[1] not in color_map[p]['g']: return False
    if c[2] not in color_map[p]['b']: return False
    r = color_map[p]['r'].index(c[0])
    g = color_map[p]['g'].index(c[1])
    b = color_map[p]['b'].index(c[2])
    return (hex(r)[2:].zfill(2) +hex(g)[2:].zfill(2) +hex(b)[2:].zfill(2)).upper()

def sec_routine():
    now = datetime.datetime.now()
    if now.second == 0:
        scheduler.remove_job('sec_routine')
        if (now.hour*60 +now.minute)%36 == 10:
            scheduler.add_job(func=json_updater, trigger='interval', minutes=36, id='json_updater')
        else:
            print(f'{now}: minute check start!')
            scheduler.add_job(func=min_routine, trigger='interval', minutes=1, id='min_routine')

def min_routine():
    now = datetime.datetime.now()
    if (now.hour*60 +now.minute)%36 == 10:
        scheduler.remove_job('min_routine')
        print(f'{now}: json updater start!')
        json_updater()
        scheduler.add_job(func=json_updater, trigger='interval', minutes=36, id='json_updater')

def json_updater():
    async def async_container():
        print('json update start at', datetime.datetime.now())
        tasks = []
        for npc in npc_list:
            for server in server_list:
                for ch in range(1, channel_list[server] +1):
                    if ch == 11:
                        continue
                    tasks.append(json_update(npc, server, ch))
        await asyncio.gather(*tasks)
        with open(shopfilepath, 'w', encoding='UTF8') as f:
            json.dump(shop_data, f, ensure_ascii=False, indent='\t')
        print('json update end at', datetime.datetime.now())
    asyncio.run(async_container())

async def json_update(npc, server, ch):
    shop_list_i = get_shop_list(npc, server, ch)
    if not shop_list_i.get('error') and shop_list_i.get('shop') and sac_data(shop_list_i) != -1:
        shop_data[npc][server][str(ch)] = shop_list_i['shop'][sac_data(shop_list_i)]
        shop_data[npc][server][str(ch)]['date_shop_next_update'] = shop_list_i['date_shop_next_update']
        shop_data[npc][server]['date_shop_next_update'] = shop_list_i['date_shop_next_update']

scheduler = BackgroundScheduler()
scheduler.add_job(func=sec_routine, trigger='interval', seconds=1, id='sec_routine')
print(f'{datetime.datetime.now()}: second check start!')
scheduler.start()

load_dotenv()
headers = {
    "x-nxopen-api-key": environ.get('nexon_api_key')
}

npc_list = ['상인 라누', '상인 피루', '상인 아루', '상인 누누', '상인 메루', '상인 세누', '상인 베루', '상인 에루', '상인 네루', '테일로', '켄', '리나', '카디', '상인 세누', '귀넥', '얼리', '데위', '모락']
server_list = ['류트', '만돌린', '하프', '울프']
channel_list = {'류트': 42, '만돌린': 15, '하프': 24, '울프': 15}

with open(shopfilepath, 'r', encoding='UTF8') as f:
    shop_data = json.load(f)

with open(colorfilepath, 'r') as f:
    color_map = json.load(f)

app = Flask(__name__)

@app.route('/static/<path:filename>')
def serve_static(filename):
    response = make_response(send_from_directory('static', filename))
    response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1년 동안 캐싱
    return response

@app.get('/')
def index():
    return render_template('index.html')

@app.get('/<npc_name>/<server_name>')
def test(npc_name, server_name):
    if npc_name not in npc_list or server_name not in server_list:
        return '비정상적인 요청'
    shop_list = shop_data[npc_name][server_name]
    for i in range(1, channel_list[server_name] +1):
        if i == 11:
            continue
        shop_list_i = shop_list[str(i)]
        if (not shop_list_i.get('date_shop_next_update')
            or datetime.datetime.now().astimezone(tz_utc) > datetime.datetime.strptime(shop_list_i.get('date_shop_next_update'), '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=tz_utc) +datetime.timedelta(minutes=10)):
            shop_list_i = get_shop_list(npc_name, server_name, i)
            if not shop_list_i.get('error') and shop_list_i.get('shop') and sac_data(shop_list_i) != -1:
                shop_list[str(i)] = shop_list_i['shop'][sac_data(shop_list_i)]
                shop_list[str(i)]['date_shop_next_update'] = shop_list_i['date_shop_next_update']
                shop_data[npc_name][server_name][str(i)] = shop_list[str(i)]
                shop_data[npc_name][server_name]['date_shop_next_update'] = shop_list_i['date_shop_next_update']
    with open(shopfilepath, 'w', encoding='UTF8') as f:
        json.dump(shop_data, f, ensure_ascii=False, indent='\t')
    sac_data_list = {str(i+1): get_sac_colorcode(shop_list[str(i+1)]) if i != 10 else {} for i in range(channel_list[server_name])}
    sac_data_list['date_shop_next_update'] = shop_list['date_shop_next_update']
    return sac_data_list

# @app.get('/date_shop_next_update')
# def forcereload():
#     for npc in npc_list:
#         for server in server_list:
#             for ch in range(1, channel_list[server] +1):
#                 shop_list = shop_data[npc][server][str(ch)]
#                 if ch == 11:
#                     continue
#                 print(shop_list['date_shop_next_update'])
#     return 'date_shop_next_update'

# if __name__ == '__main__':
#     # app.run(host='localhost', port=8080, debug=True)
#     app.run(host='localhost', port=8080)