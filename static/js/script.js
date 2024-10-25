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
const result_container = document.querySelector('.result-container');
const color_code_type = document.querySelectorAll("input[name='color-code']");

const search_sample_hex = document.querySelectorAll('.search-sample.hex');
const search_code_hex = document.querySelectorAll('.search-code.hex');
const search_error_hex = document.querySelector('.search-error.hex');
const search_button_hex = document.querySelector('.search-button.hex');

const search_sample_dec = document.querySelectorAll('.search-sample.dec');
const search_code_dec = document.querySelectorAll('.search-code.dec');
const search_error_dec = document.querySelector('.search-error.dec');
const search_button_dec = document.querySelector('.search-button.dec');

const sac_list = [
    '튼튼한 달걀 주머니', '튼튼한 감자 주머니', '튼튼한 옥수수 주머니', '튼튼한 밀 주머니', '튼튼한 보리 주머니',
    '튼튼한 양털 주머니', '튼튼한 거미줄 주머니', '튼튼한 가는 실뭉치 주머니', '튼튼한 굵은 실뭉치 주머니',
    '튼튼한 저가형 가죽 주머니', '튼튼한 일반 가죽 주머니', '튼튼한 고급 가죽 주머니', '튼튼한 최고급 가죽 주머니',
    '튼튼한 저가형 옷감 주머니', '튼튼한 일반 옷감 주머니', '튼튼한 고급 옷감 주머니', '튼튼한 최고급 옷감 주머니',
    '튼튼한 저가형 실크 주머니', '튼튼한 일반 실크 주머니', '튼튼한 고급 실크 주머니', '튼튼한 최고급 실크 주머니',
    '튼튼한 꽃바구니'
];
let is_search = false;
let color_type = '';
let modal_color_show = null;
let next_update_time = new Date();

window.addEventListener('DOMContentLoaded', (e) => {
    const server = get_cookie('server');
    if (server == null) {
        server_select.options[1].selected = true;
    } else {
        for (let i=0;i<4;i++) {
            if (server_select.options[i].value == server) {
                server_select.options[i].selected = true;
                break;
            }
        }
    }
    const codetype = get_cookie('codetype');
    if (codetype == null) {
        color_type = 'hex-code';
        color_code_type[0].checked = true;
    } else {
        color_type = codetype;
        for (let i=0;i<2;i++) {
            if (color_code_type[i].getAttribute('id') == codetype) {
                color_code_type[i].checked = true;
                break;
            }
        }
    }
    if (color_type == 'hex-code') {
        document.querySelector('.search.hex').style.display = 'inline-flex';
        document.querySelector('.search.dec').style.display = 'none';
    } else {
        document.querySelector('.search.dec').style.display = 'inline-flex';
        document.querySelector('.search.hex').style.display = 'none';
    }
    modal_color_code.forEach(code => {
        code.classList.add(color_type);
    });

    thumbnail_img.forEach(thimg => {
        thimg.dataset.grayScale = thimg.getAttribute('src');
    })

    server_select.addEventListener('change', () => {
        set_cookie('server', server_select.value, 604800*1000);
    });
    
    color_code_type.forEach(radio => {
        radio.addEventListener('change', () => {
            const codetype = radio.getAttribute('id');
            color_type = codetype;
            set_cookie('codetype', codetype, 604800*1000);
            modal_color_code.forEach(code => {
                code.classList.remove('dec-code');
                code.classList.remove('hex-code');
                code.classList.add(codetype);
                if (codetype == 'dec-code' && is_hexcode(code.innerText)) {
                    code.innerText = dec_color_code(code.innerText);
                } else if (codetype == 'hex-code' && is_deccode(code.innerText)) {
                    code.innerText = hex_color_code(code.innerText);
                }
            });
            document.querySelectorAll('.result-code').forEach(code => {
                code.classList.remove('dec-code');
                code.classList.remove('hex-code');
                code.classList.add(codetype);
                if (codetype == 'dec-code' && is_hexcode(code.innerText)) {
                    code.innerText = dec_color_code(code.innerText);
                } else if (codetype == 'hex-code' && is_deccode(code.innerText)) {
                    code.innerText = hex_color_code(code.innerText);
                }
            });
            if (color_type == 'hex-code') {
                document.querySelector('.search.hex').style.display = 'inline-flex';
                document.querySelector('.search.dec').style.display = 'none';
            } else {
                document.querySelector('.search.dec').style.display = 'inline-flex';
                document.querySelector('.search.hex').style.display = 'none';
            }
        });
    });

    server_select.addEventListener('change', sac_update);
    location_select.addEventListener('change', sac_update);
    set_drag_scroll_x(table_container);
    set_drag_scroll_y(table_container);
    set_drag_scroll_x(result_container);

    sac_update();
});

document.addEventListener('mousemove', e => {
    let x = e.pageX -modal_color_box.offsetWidth -5;
    let y = e.pageY -modal_color_box.offsetHeight -5;
    modal_color_box.style.left = x +'px';
    modal_color_box.style.top = y +'px';
});

search_button_hex.addEventListener('click', () => {
    color_search(search_code_hex[0].value, search_code_hex[1].value, search_code_hex[2].value, search_error_hex.value);
});
search_button_dec.addEventListener('click', () => {
    let code = ['', '' ,''];
    
    for (let i=0;i<3;i++) {
        for (let j=0;j<3;j++) {
            if (search_code_dec[j +i*3].value == '') {
                code[i] = '-';
                break;
            }
            dec = Number(search_code_dec[j +i*3].value);
            code[i] += leftpad(dec2hex(dec), 2, 0);
        }
    }
    color_search(code[0], code[1], code[2], search_error_dec.value);
});

for (let i=0;i<3;i++) {
    search_code_hex[i].addEventListener('input', () => {
        if (is_hexcode(search_code_hex[i].value)) {
            search_sample_hex[i].style.backgroundColor = `#${search_code_hex[i].value}`;
            search_sample_dec[i].style.backgroundColor = `#${search_code_hex[i].value}`;
            let code = hex2dec_color(search_code_hex[i].value);
            for (let j=0;j<3;j++) {
                search_code_dec[j +i*3].value = code[j];
            }
        } else {
            search_sample_hex[i].style.backgroundColor = '#7F7F7F';
            search_sample_dec[i].style.backgroundColor = '#7F7F7F';
            for (let j=0;j<3;j++) {
                search_code_dec[j +i*3].value = '';
            }
        }
    });
}

for (let i=0;i<3;i++) {
    for (let j=0;j<3;j++) {
        search_code_dec[j +i*3].addEventListener('input', () => {
            clamp = function() {
                if (search_code_dec[j +i*3].value == '') {
                    search_code_dec[j +i*3].value = '';
                    return;
                }
                let err = Number(search_code_dec[j +i*3].value);
                search_code_dec[j +i*3].value = Math.floor(err);
                if (isNaN(err)) {
                    search_code_dec[j +i*3].value = '';
                    return;
                } 
                if (err < 0) {
                    search_code_dec[j +i*3].value = '0';
                    return;
                }
                if (err > 255) {
                    search_code_dec[j +i*3].value = '255';
                    return;
                }
            }
            clamp();

            let code = '';
            for (let k=0;k<3;k++) {
                if (search_code_dec[k +i*3].value == '') {
                    code = '-';
                    break;
                }
                dec = Number(search_code_dec[k +i*3].value);
                code += leftpad(dec2hex(dec), 2, 0);
            }
            if (is_hexcode(code)) {
                search_sample_dec[i].style.backgroundColor = `#${code}`;
                search_sample_hex[i].style.backgroundColor = `#${code}`;
                search_code_hex[i].value = code;
            } else {
                search_sample_dec[i].style.backgroundColor = '#7F7F7F';
                search_sample_hex[i].style.backgroundColor = '#7F7F7F';
                search_code_hex[i].value = '';
            }
        });
    }
}

search_error_hex.addEventListener('input', () => {
    if (search_error_hex.value == '') {
        search_error_hex.value = '';
        search_error_dec.value = '';
        return;
    }
    let err = Number(search_error_hex.value);
    search_error_hex.value = Math.floor(err);
    if (isNaN(err)) {
        search_error_hex.value = '';
        return;
    } 
    if (err < 0) {
        search_error_hex.value = '0';
        return;
    }
    if (err > 255) {
        search_error_hex.value = '255';
        return;
    }
    search_error_dec.value = search_error_hex.value;
});
search_error_hex.addEventListener('focus', () => {
    if (search_error_hex.value == '0') {
        search_error_hex.value = '';
        search_error_dec.value = '';
    }
});
search_error_hex.addEventListener('blur', () => {
    if (search_error_hex.value == '') {
        search_error_hex.value = 0;
        search_error_dec.value = 0;
    }
});
search_error_dec.addEventListener('input', () => {
    if (search_error_dec.value == '') {
        search_error_dec.value = '';
        search_error_hex.value = '';
        return;
    }
    let err = Number(search_error_dec.value);
    search_error_dec.value = Math.floor(err);
    if (isNaN(err)) {
        search_error_dec.value = '';
        return;
    } 
    if (err < 0) {
        search_error_dec.value = '0';
        return;
    }
    if (err > 255) {
        search_error_dec.value = '255';
        return;
    }
    search_error_hex.value = search_error_dec.value;
});
search_error_dec.addEventListener('focus', () => {
    if (search_error_dec.value == '0') {
        search_error_dec.value = '';
        search_error_hex.value = '';
    }
});
search_error_dec.addEventListener('blur', () => {
    if (search_error_dec.value == '') {
        search_error_dec.value = 0;
        search_error_hex.value = 0;
    }
});

async function sac_update() {
    const location = location_select.value;
    const server = server_select.value;
    sac_container.innerHTML = '';
    table_container.scrollTop = 0;
    result_container.innerHTML = '';
    for (let i=0;i<3;i++) {
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
    is_search = false;
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
                        if (color_type == 'hex-code') {
                            modal_color_code[i].innerText = color_code[i];
                        } else {
                            modal_color_code[i].innerText = dec_color_code(color_code[i]);
                        }
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
                    if (color_type == 'hex-code') {
                        modal_color_code[i+3].innerText = color_code[i];
                    } else {
                        modal_color_code[i+3].innerText = dec_color_code(color_code[i]);
                    }
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

        // if (is_hexcode()) {
        //     color_search(error_input.value);
        // }
    });
}

function color_search(a, b, c, er = 0) {
    a = is_hexcode(a) ? a : '-';
    b = is_hexcode(b) ? b : '-';
    c = is_hexcode(c) ? c : '-';
    er = isNaN(Number(er)) ? 0 : Number(er);
    result_container.innerHTML = '';
    const sacs = document.querySelectorAll('.sac');
    const color_code = [a, b, c];
    let results = [];

    for (const sac of sacs) {
        if (results.includes(sac.dataset.colorCode)) {
            continue;
        }
        const sac_data = sac.dataset.colorCode.split(',');
        let max_error = 0;
        for (let i=0;i<3;i++) {
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
            for (let i=0;i<3;i++) {
                const result_bar = document.createElement('div');
                result_bar.setAttribute('class', 'result-bar');
                
                const result_sample = document.createElement('div');
                result_sample.setAttribute('class', 'result-sample');
                result_sample.setAttribute('style', `background-color: #${sac_data[i]};`);
                result_sample.innerText = alpha[i];
                result_bar.appendChild(result_sample);

                const result_code = document.createElement('span');
                result_code.classList.add('result-code');
                result_code.classList.add(color_type);
                if (color_type == 'hex-code') {
                    result_code.innerText = sac_data[i];
                } else {
                    result_code.innerText = dec_color_code(sac_data[i]);
                }
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
                    if (color_type == 'hex-code') {
                        modal_color_code[i].innerText = color_code[i];
                    } else {
                        modal_color_code[i].innerText = dec_color_code(color_code[i]);
                    }
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
function is_deccode(code) {
    if (code.length != 13) return false;
    return /[\ \u00a00-9]{2}[0-9]{1}\,[\ \u00a0][\ \u00a00-9]{2}[0-9]{1}\,[\ \u00a0][\ \u00a00-9]{2}[0-9]{1}/i.test(code);
}
function is_hexcode(code) {
    if (code.length != 6) return false;
    return /[a-f0-9]{6}$/i.test(code);
}
function hex_color_code(dec) {
    let code = dec.split(',');
    for (let i=0;i<3;i++) {
        code[i] = code[i].trim();
    }
    return dec2hex_color(code);
}
function dec_color_code(hex) {
    let code = hex2dec_color(hex);
    let str = leftpad(String(code[0]), 3, '\u00a0') +', ' +leftpad(String(code[1]), 3, '\u00a0') +', ' +leftpad(String(code[2]), 3, '\u00a0');
    return str;
}
function dec2hex_color(dec) {
    return leftpad(dec2hex(dec[0]), 2, 0) +leftpad(dec2hex(dec[1]), 2, 0) +leftpad(dec2hex(dec[2]), 2, 0);
}
function hex2dec_color(hex) {
    const r = hex2dec(hex.slice(0, 2));
    const g = hex2dec(hex.slice(2, 4));
    const b = hex2dec(hex.slice(4, 6));
    return [r, g, b];
}
function hex2dec(hex) {
    hex = hex.toUpperCase();
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
function dec2hex(dec) {
    let value = "";
    while (dec) {
        switch (dec % 16) {
            case 10:
                value = "A" + value;
                break;
            case 11:
                value = "B" + value;
                break;
            case 12:
                value = "C" + value;
                break;
            case 13:
                value = "D" + value;
                break;
            case 14:
                value = "E" + value;
                break;
            case 15:
                value = "F" + value;
                break;
            default:
                value = (dec % 16) + value;
                break;
        }
        dec = Math.floor(dec/16);
    }
    return value;
}