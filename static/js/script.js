const server_select = document.querySelector('#server');
const location_select = document.querySelector('#location');
const table_container = document.querySelector('.table-container');
const sac_container = document.querySelector('.sac-container');
const sac_col = document.querySelectorAll('.sac-name');
const next_update = document.querySelector('.next-update');
const modal_color_box = document.querySelector('.color-box.thumbnail');
const modal_color_sample = document.querySelectorAll('.color-sample');
const modal_color_code = document.querySelectorAll('.color-code');
const thumbnail_img = document.querySelectorAll('.sac-thumbnail');
const thumbnail_channel = document.querySelectorAll('.thumbnail-channel');
const search_sample = document.querySelectorAll('.search-sample');
const search_input = document.querySelectorAll('.search-code');
const search_button = document.querySelector('.search-button');
const result_container = document.querySelector('.result-container');

const sac_list = [
                    '튼튼한 달걀 주머니', '튼튼한 감자 주머니', '튼튼한 옥수수 주머니', '튼튼한 밀 주머니', '튼튼한 보리 주머니',
                    '튼튼한 양털 주머니', '튼튼한 거미줄 주머니', '튼튼한 가는 실뭉치 주머니', '튼튼한 굵은 실뭉치 주머니',
                    '튼튼한 저가형 가죽 주머니', '튼튼한 일반 가죽 주머니', '튼튼한 고급 가죽 주머니', '튼튼한 최고급 가죽 주머니',
                    '튼튼한 저가형 옷감 주머니', '튼튼한 일반 옷감 주머니', '튼튼한 고급 옷감 주머니', '튼튼한 최고급 옷감 주머니',
                    '튼튼한 저가형 실크 주머니', '튼튼한 일반 실크 주머니', '튼튼한 고급 실크 주머니', '튼튼한 최고급 실크 주머니',
                    '튼튼한 꽃바구니'
                ];                
let is_search = false;
let modal_color_show = null;
let next_update_time = new Date();

window.addEventListener('DOMContentLoaded', (e) => {
    const server = get_cookie('server');
    if (server == null) {
        server_select.options[1].selected = true;
    } else {
        for (i=0; i<4; i++) {
            if (server_select.options[i].value == server) {
                server_select.options[i].selected = true;
                break;
            }
        }
    }
    sac_update();
    thumbnail_img.forEach(thimg => {
        thimg.dataset.grayScale = thimg.getAttribute('src');
    })

    server_select.addEventListener('change', () => {
        set_cookie('server', server_select.value, 604800*1000);
    });
    
    server_select.addEventListener('change', sac_update);
    location_select.addEventListener('change', sac_update);
    set_drag_scroll_x(table_container);
    set_drag_scroll_y(table_container);
    set_drag_scroll_x(result_container);
});

document.addEventListener('mousemove', e => {
    let x = e.pageX -modal_color_box.offsetWidth -5;
    let y = e.pageY -modal_color_box.offsetHeight -5;
    modal_color_box.style.left = x +'px';
    modal_color_box.style.top = y +'px';
});
search_button.addEventListener('click', () => {
    color_search(
        search_input[0].value,
        search_input[1].value,
        search_input[2].value,
        search_input[3].value
    );
});

for (let i=0;i<3;i++) {
    search_input[i].addEventListener('input', () => {
        if (is_hexcode(search_input[i].value)) {
            search_sample[i].setAttribute('style', `background-color: #${search_input[i].value}`);
        } else {
            search_sample[i].setAttribute('style', `background-color: #7F7F7F;`);
        }
    });
}

async function sac_update() {
    const location = location_select.value;
    const server = server_select.value;
    sac_container.innerHTML = '';
    sac_container.classList.add('loading');
    const response = await fetch(`/${location}/${server}`);
    const res = await response.json();
    const channels = Object.keys(res);
    const new_sac_container = document.createElement('div');
    new_sac_container.setAttribute('class', 'sac-container');
    
    channels.forEach(ch => {
        if (ch == 'date_shop_next_update') {
            const date = new Date(res[ch]);
            const time = `${leftpad(date.getMonth()+1, 2, '0')}.${leftpad(date.getDate(), 2, '0')} ${leftpad(date.getHours(), 2, '0')}:${leftpad(date.getMinutes(), 2, '0')}`
            next_update.innerText = time;
            next_update_time = date;
        } else if (ch != 11) {
            const div_channel = document.createElement('div');
            div_channel.setAttribute('class', 'channel-container');
            const channel = document.createElement('div');
            channel.setAttribute('class', 'channel');
            channel.innerText = ch +'채널';

            div_channel.appendChild(channel);
            sac_list.forEach(sac => {
                const data = res[ch][sac];
                const div_sac = document.createElement('div');
                div_sac.setAttribute('class', 'sac');
                div_sac.dataset.colorCode = data.color;
                div_sac.dataset.channel = ch;
                div_sac.dataset.sacName = sac;

                const sac_img = document.createElement('img');
                sac_img.setAttribute('class', 'sac-img');
                sac_img.setAttribute('draggable', 'false');
                sac_img.setAttribute('src', data.image);
                div_sac.appendChild(sac_img);

                const color_box = document.createElement('div');
                color_box.setAttribute('class', 'color-box');
                const alpha = ['A', 'B', 'C'];
                for (i=0; i<3; i++) {
                    const c = data.color[i];
                    const color_bar = document.createElement('div');
                    color_bar.setAttribute('class', 'color-bar');

                    const color_sample = document.createElement('div');
                    color_sample.setAttribute('class', 'color-sample');
                    color_sample.setAttribute('style', `background-color: #${c};`);
                    color_sample.innerText = alpha[i];
                    color_bar.appendChild(color_sample);

                    color_box.appendChild(color_bar);
                }
                div_sac.appendChild(color_box);
                
                div_channel.appendChild(div_sac);
            });
            new_sac_container.appendChild(div_channel);
        }
        sac_container.innerHTML = new_sac_container.innerHTML;
        const sacs = document.querySelectorAll('.sac');
        sacs.forEach(sac => {
            sac.addEventListener('dblclick', () => {
                const target_code = sac.dataset.colorCode;
                sacs.forEach(sac => {
                    sac.querySelector('.sac-img').style.visibility = 'visible';
                    sac.querySelector('.color-box').style.visibility = 'visible';
                });
                for (i=0;i<3;i++) {
                    modal_color_sample[i].setAttribute('style', `background-color: #7F7F7F;`);
                    modal_color_code[i].innerText = '';
                }
                sac_col.forEach(name => {
                    name.dataset.searched = '';
                });
                thumbnail_img.forEach(thimg => {
                    thimg.setAttribute('src', thimg.dataset.grayScale);
                });
                thumbnail_channel.forEach(thch => {
                    thch.innerText = '';
                });
                if (is_search) {
                    is_search = false;
                } else {
                    const color_code = target_code.split(',');
                    for (i=0;i<3;i++) {
                        modal_color_sample[i].setAttribute('style', `background-color: #${color_code[i]};`);
                        modal_color_code[i].innerText = color_code[i];
                    }
                    sacs.forEach(sac => {
                        if (sac.dataset.colorCode == target_code) {
                            let i = sac_list.indexOf(sac.dataset.sacName);
                            sac_col[i].dataset.searched = "O";
                            thumbnail_img[i].setAttribute('src', sac.querySelector('.sac-img').getAttribute('src'));

                            if (thumbnail_channel[i].innerText != '') {
                                thumbnail_channel[i].innerText += ',\u00a0';
                            }
                            thumbnail_channel[i].innerText += sac.dataset.channel;
                        } else {
                            sac.querySelector('.sac-img').style.visibility = 'hidden';
                            sac.querySelector('.color-box').style.visibility = 'hidden';
                        }
                    });
                    thumbnail_channel.forEach(thch => {
                        if (thch.innerText != '') {
                            thch.innerText += ' 채널';
                        } else {
                            thch.innerText += '-';
                        }
                    });
                    is_search = target_code;
                }
            });
            sac.addEventListener('mouseenter', (e) => {
                const color_code = sac.dataset.colorCode.split(',');
                for (i=0;i<3;i++) {
                    modal_color_sample[i+3].setAttribute('style', `background-color: #${color_code[i]};`);
                    modal_color_code[i+3].innerText = color_code[i];
                }
            });
            sac.addEventListener('mousemove', e => {
                if (sac.querySelector('.sac-img').style.visibility == 'hidden') {
                    return;
                }
                modal_color_box.style.visibility = 'hidden';
                clearTimeout(modal_color_show);
                modal_color_show = setTimeout(() => {
                    modal_color_box.style.visibility = 'visible';
                }, 1000);
            });
            sac.addEventListener('mouseleave', () => {
                modal_color_box.style.visibility = 'hidden';
                clearTimeout(modal_color_show);
            });
        });
        sac_container.classList.remove('loading');
    });
}

function color_search(a, b, c, er = 0) {
    a = is_hexcode(a) ? a : '-';
    b = is_hexcode(b) ? b : '-';
    c = is_hexcode(c) ? c : '-';
    er = isNaN(Number(er)) ? 0 : Number(er);

    result_container.innerHTML = '';
    const sacs = document.querySelectorAll('.sac');
    sac_col.forEach(name => {
        name.dataset.searched = '';
    });
    const color_code = [a, b, c];
    let results = [];

    for (const sac of sacs) {
        if (results.includes(sac.dataset.colorCode)) {
            continue;
        }
        const sac_data = sac.dataset.colorCode.split(',');
        let max_error = 0;
        for (i=0;i<3;i++) {
            if (color_code[i] == '-') {
                continue;
            }
            let search_code = hex2dec_color(color_code[i]);
            let sac_code = hex2dec_color(sac_data[i]);
            for (j=0;j<3;j++) {
                err = Math.abs(sac_code[j] - search_code[j]);
                if (max_error < err) {
                    max_error = err;
                }
            }
        }
        if (max_error <= er) {
            results.push(sac.dataset.colorCode);
            const result_box = document.createElement('div');
            result_box.setAttribute('class', 'result-box');
            result_box.dataset.colorCode = sac_data;
            const alpha = ['A', 'B', 'C'];
            for (i=0;i<3;i++) {
                const result_bar = document.createElement('div');
                result_bar.setAttribute('class', 'result-bar');
                
                const result_sample = document.createElement('div');
                result_sample.setAttribute('class', 'result-sample');
                result_sample.setAttribute('style', `background-color: #${sac_data[i]};`);
                result_sample.innerText = alpha[i];
                result_bar.appendChild(result_sample);

                const result_code = document.createElement('span');
                result_code.setAttribute('class', 'result-code');
                result_code.innerText = sac_data[i];
                result_bar.appendChild(result_code);

                result_box.appendChild(result_bar);
            }
            result_container.appendChild(result_box);
        }
    }
    
    const result_boxes = document.querySelectorAll('.result-box');
    result_boxes.forEach(result_box => {
        result_box.addEventListener('dblclick', () => {
            sacs.forEach(sac => {
                sac.querySelector('.sac-img').style.visibility = 'visible';
                sac.querySelector('.color-box').style.visibility = 'visible';
            });
            for (i=0;i<3;i++) {
                modal_color_sample[i].setAttribute('style', `background-color: #7F7F7F;`);
                modal_color_code[i].innerText = '';
            }
            sac_col.forEach(name => {
                name.dataset.searched = '';
            });
            thumbnail_img.forEach(thimg => {
                thimg.setAttribute('src', thimg.dataset.grayScale);
            });
            thumbnail_channel.forEach(thch => {
                thch.innerText = '';
            });
            const target_code = result_box.dataset.colorCode;
            if (is_search == target_code) {
                is_search = false;
            } else {
                const color_code = target_code.split(',');
                for (i=0;i<3;i++) {
                    modal_color_sample[i].setAttribute('style', `background-color: #${color_code[i]};`);
                    modal_color_code[i].innerText = color_code[i];
                }
                sacs.forEach(sac => {
                    if (sac.dataset.colorCode == target_code) {
                        let i = sac_list.indexOf(sac.dataset.sacName);
                        sac_col[i].dataset.searched = "O";
                        thumbnail_img[i].setAttribute('src', sac.querySelector('.sac-img').getAttribute('src'));

                        if (thumbnail_channel[i].innerText != '') {
                            thumbnail_channel[i].innerText += ',\u00a0';
                        }
                        thumbnail_channel[i].innerText += sac.dataset.channel;
                    } else {
                        sac.querySelector('.sac-img').style.visibility = 'hidden';
                        sac.querySelector('.color-box').style.visibility = 'hidden';
                    }
                });
                thumbnail_channel.forEach(thch => {
                    if (thch.innerText != '') {
                        thch.innerText += ' 채널';
                    } else {
                        thch.innerText += '-';
                    }
                });
                is_search = target_code;
            }
        });
    });
}

function set_drag_scroll_x(target) {
    target.addEventListener('mousedown', e => {
        target.dataset.isDown = true;
        target.dataset.startX = e.pageX - target.offsetLeft;
        target.dataset.scrollLeft = target.scrollLeft;
    });
    target.addEventListener('mouseleave', () => {
        target.dataset.isDown = false;
    });
    target.addEventListener('mouseup', e => {
        target.dataset.isDown = false;
        e.preventDefault();
    });
    target.addEventListener('mousemove', e => {
        if (target.dataset.isDown == 'false') {
            return;
        }
        e.preventDefault();
        const x = e.pageX - target.offsetLeft;
        const walk = x - target.dataset.startX;
        target.scrollLeft = target.dataset.scrollLeft - walk;
    });
}
function set_drag_scroll_y(target) {
    target.addEventListener('mousedown', e => {
        target.dataset.isDown = true;
        target.dataset.startY = e.pageY - target.offsetTop;
        target.dataset.scrollTop = target.scrollTop;
    });
    target.addEventListener('mouseleave', () => {
        target.dataset.isDown = false;
    });
    target.addEventListener('mouseup', e => {
        target.dataset.isDown = false;
        e.preventDefault();
    });
    target.addEventListener('mousemove', e => {
        if (target.dataset.isDown == 'false') {
            return;
        }
        e.preventDefault();
        const y = e.pageY - target.offsetTop;
        const walk = y - target.dataset.startY;
        target.scrollTop = target.dataset.scrollTop - walk;
    });
}

function set_cookie(name, value, unixTime) {
    var date = new Date();
    date.setTime(date.getTime() + unixTime);
    document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';expires=' + date.toUTCString() + ';path=/';
}
function get_cookie(name) {
    var value = document.cookie.match('(^|;) ?' + encodeURIComponent(name) + '=([^;]*)(;|$)');
    return value ? decodeURIComponent(value[2]) : null;
}

function leftpad(str, len, pad) {
    str = String(str)
    while (str.length < len) {
        str = pad +str;
    }
    return str;
}

function is_hexcode(code) {
    if (code.length != 6) return false;
    return /[a-f0-9]{6}$/i.test(code);
}
function dec_color_code(code) {
    let str = '(' +leftpad(String(code[0]), 3, '\u00a0') +', ' +leftpad(String(code[1]), 3, '\u00a0') +', ' +leftpad(String(code[2]), 3, '\u00a0') +')';
    return str;
}
function hex2dec_color(hex) {
    const r = hex2dec(hex.slice(0, 2));
    const g = hex2dec(hex.slice(2, 4));
    const b = hex2dec(hex.slice(4, 6));
    return [r, g, b];
}
function hex2dec(hex) {
    let value = 0;
    for (let i = 0; i < hex.length; ++i) {
        let temp = 0;
        switch (hex[i]) {
            case "A":
                temp = 10;
                break;
            case "B":
                temp = 11;
                break;
            case "C":
                temp = 12;
                break;
            case "D":
                temp = 13;
                break;
            case "E":
                temp = 14;
                break;
            case "F":
                temp = 15;
                break;
            default:
                temp = +hex[i];
                break;
        }
        value += temp * (16 ** (hex.length - i - 1));
    }
    return value;
}