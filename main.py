from flask import *
from os import path, environ
import requests
import re
import json
import datetime
from dotenv import load_dotenv

tz_utc = datetime.timezone.utc
root = path.dirname(path.realpath('shop_data.json'))
shopfilepath = path.join(root, 'shop_data.json')
colorfilepath = path.join(root, 'color_map.json')

p01 = re.compile('(?<=4b45)(.*?)(?=87464e)')
p02 = re.compile('(?<=87464e)(.*?)(?=8a5042)')
p03 = re.compile('(?<=8a5042)(.*?)(?=844350)')

with open(colorfilepath, 'r') as f:
    color_map = json.load(f)

load_dotenv()
headers = {
    "x-nxopen-api-key": environ.get('nexon_api_key')
}

npc_list = ['상인 라누', '상인 피루', '상인 아루', '상인 누누', '상인 메루', '상인 세누', '상인 베루', '상인 에루', '상인 네루', '테일로', '켄', '리나', '카디', '상인 세누', '귀넥', '얼리', '데위', '모락']
server_list = ['류트', '만돌린', '하프', '울프']
channel_list = {'류트': 36, '만돌린': 15, '하프': 24, '울프': 15}

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

def get_sac_list(shop_list, key):
    sac_list = shop_list['shop'][sac_data(shop_list)]['item']
    return {i['item_display_name']: i[key] for i in sac_list}

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

def image_url_to_color_code(image_url):
    return color_decode(p01.findall(image_url), 'A') +p02.findall(image_url) +p03.findall(image_url)

def color_code_to_image_url(item, color_code):
    return f'https://open.api.nexon.com/static/mabinogi/img/{item}?item_color=%7B%22color_01%22%3A%22%23{color_code[0]}%22%2C%22color_02%22%3A%22%23{color_code[1]}%22%2C%22color_03%22%3A%22%23{color_code[2]}%22%2C%22color_04%22%3A%22%23{color_code[3]}%22%2C%22color_05%22%3A%22%23{color_code[4]}%22%2C%22color_06%22%3A%22%23{color_code[5]}%22%7D'

app = Flask(__name__)

@app.get('/')
def index():
    return render_template('index.html')

@app.get('/<npc_name>/<server_name>')
def test(npc_name, server_name):
    if npc_name not in npc_list or server_name not in server_list:
        return '비정상적인 요청'
    
    with open(shopfilepath, 'r', encoding='UTF8') as f:
        shop_data = json.load(f)
    shop_list = shop_data[npc_name][server_name]
    for i in range(1, channel_list[server_name] +1):
        if i == 11:
            pass
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
    sac_data_list = {str(i+1): get_sac_colorcode(shop_list[str(i+1)]) for i in range(channel_list[server_name])}
    sac_data_list['date_shop_next_update'] = shop_list['date_shop_next_update']
    return sac_data_list

if __name__ == '__main__':
    app.run(host='localhost', port=8080, debug=True)