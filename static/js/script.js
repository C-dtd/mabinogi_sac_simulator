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

const prev_location = document.querySelector('#prev-location');
const next_location = document.querySelector('#next-location');

const sac_list = [
    '튼튼한 달걀 주머니', '튼튼한 감자 주머니', '튼튼한 옥수수 주머니', '튼튼한 밀 주머니', '튼튼한 보리 주머니',
    '튼튼한 양털 주머니', '튼튼한 거미줄 주머니', '튼튼한 가는 실뭉치 주머니', '튼튼한 굵은 실뭉치 주머니',
    '튼튼한 저가형 가죽 주머니', '튼튼한 일반 가죽 주머니', '튼튼한 고급 가죽 주머니', '튼튼한 최고급 가죽 주머니',
    '튼튼한 저가형 옷감 주머니', '튼튼한 일반 옷감 주머니', '튼튼한 고급 옷감 주머니', '튼튼한 최고급 옷감 주머니',
    '튼튼한 저가형 실크 주머니', '튼튼한 일반 실크 주머니', '튼튼한 고급 실크 주머니', '튼튼한 최고급 실크 주머니',
    '튼튼한 꽃바구니'
];
const imageCache = {};
const canvasCache = {};

let is_search = false;
let color_type = '';
let modal_color_show = null;
let next_update_time = new Date();

window.addEventListener('DOMContentLoaded', async () => {
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
        thimg.dataset.grayScale = true;
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

    await loadImages([
        'Barley_base', 'Barley_L', 'Barley1',
        'Cloth_1', 'Cloth_1i', 'Cloth_1o',
        'Cloth_2', 'Cloth_2i', 'Cloth_2o',
        'Cloth_3', 'Cloth_3i', 'Cloth_3o',
        'Cloth_4', 'Cloth_4i', 'Cloth_4o',
        'Cloth_base', 'Cloth_L', 'Cloth1', 'Cloth2',
        'Cobweb_base', 'Cobweb_L', 'Cobweb1', 'Cobweb2', 'Cobweb3',
        'Corn_base', 'Corn_L', 'Corn1',
        'Egg_base', 'Egg_L', 'Egg1',
        'Flower_base', 'Flower_L', 'Flower1', 'Flower2', 'Flower3',
        'Leather_1', 'Leather_1i', 'Leather_1o',
        'Leather_2', 'Leather_2i', 'Leather_2o',
        'Leather_3', 'Leather_3i', 'Leather_3o',
        'Leather_4', 'Leather_4i', 'Leather_4o',
        'Leather_base', 'Leather_L', 'Leather1', 'Leather2',
        'Plus',
        'Potato_base', 'Potato_L', 'Potato1',
        'Silk_1', 'Silk_1i', 'Silk_1o',
        'Silk_2', 'Silk_2i', 'Silk_2o',
        'Silk_3', 'Silk_3i', 'Silk_3o',
        'Silk_4', 'Silk_4i', 'Silk_4o',
        'Silk_base', 'Silk_L', 'Silk1', 'Silk2',
        'Thick_base', 'Thick_L', 'Thick1', 'Thick2', 'Thick3',
        'Thin_base', 'Thin_L', 'Thin1', 'Thin2', 'Thin3',
        'Wheat_base', 'Wheat_L', 'Wheat1',
        'Wool_base', 'Wool_L', 'Wool1', 'Wool2'
    ]);
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

prev_location.addEventListener('click', () => {
    if (location_select.selectedIndex === 0) {
        location_select.selectedIndex = location_select.options.length-1;
    } else {
        location_select.selectedIndex = (location_select.selectedIndex -1) %location_select.options.length;
    }
    sac_update();
});
next_location.addEventListener('click', () => {
    location_select.selectedIndex = (location_select.selectedIndex +1) %location_select.options.length;
    sac_update();
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
        thimg.dataset.grayScale = true;
        thimg.getContext('2d').clearRect(0, 0, 48, 48);
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
    
    channels.forEach(async ch => {
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
            sac_list.forEach(async sac => {
                const data = res[ch][sac];
                const div_sac = document.createElement('div');
                div_sac.setAttribute('class', 'sac');
                div_sac.dataset.colorCode = data.color;
                div_sac.dataset.channel = ch;
                div_sac.dataset.sacName = sac;
                
                const hover_container = document.createElement('div');
                hover_container.setAttribute('class', 'hover-container');

                const sac_img = document.createElement('canvas');
                sac_img.setAttribute('class', 'sac-img');
                sac_img.setAttribute('width', '48');
                sac_img.setAttribute('height', '48');
                sac_img.setAttribute('draggable', 'false');
                hover_container.appendChild(sac_img);

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
                hover_container.appendChild(color_box);
                
                div_sac.appendChild(hover_container);
                div_channel.appendChild(div_sac);
            });
            new_sac_container.appendChild(div_channel);
        }
        sac_container.innerHTML = new_sac_container.innerHTML;
        const sacs = document.querySelectorAll('.sac');
        sacs.forEach(sac => {
            sac.querySelector('.hover-container').addEventListener('dblclick', () => {
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
                    thimg.dataset.grayScale = true;
                    thimg.getContext('2d').clearRect(0, 0, 48, 48);
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
                            if (thumbnail_img[i].dataset.grayScale == 'true') {
                                thumbnail_img[i].dataset.grayScale = false;
                                thumbnail_img[i].getContext('2d').drawImage(sac.querySelector('.sac-img'), 0, 0);
                            }

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
            sac.querySelector('.hover-container').addEventListener('mouseenter', () => {
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
            sac.querySelector('.hover-container').addEventListener('mousemove', () => {
                if (sac.querySelector('.sac-img').style.visibility == 'hidden') {
                    return;
                }
                modal_color_box.style.visibility = 'hidden';
                clearTimeout(modal_color_show);
                modal_color_show = setTimeout(() => {
                    modal_color_box.style.visibility = 'visible';
                }, 1000);
            });
            sac.querySelector('.hover-container').addEventListener('mouseleave', () => {
                modal_color_box.style.visibility = 'hidden';
                clearTimeout(modal_color_show);
            });
        });

        sac_container.classList.remove('loading');

        if (is_hexcode(search_code_hex[0].value) || is_hexcode(search_code_hex[1].value) || is_hexcode(search_code_hex[2].value)) {
            color_search(search_code_hex[0].value, search_code_hex[1].value, search_code_hex[2].value, search_error_hex.value);
        }
    });
    const canvasCache = {};
    document.querySelectorAll('.sac').forEach(sac => {
        if (!(sac.dataset.sacName + sac.dataset.colorCode in canvasCache)) {
            canvasCache[sac.dataset.sacName + sac.dataset.colorCode] = sac;
        }
    });

    const promises = Object.entries(canvasCache).map(([key, sac]) => sac_draw(sac));
    await Promise.all(promises);

    document.querySelectorAll('.sac').forEach(sac => {
        sac.querySelector('.sac-img').getContext('2d').drawImage(canvasCache[sac.dataset.sacName + sac.dataset.colorCode].querySelector('.sac-img'), 0, 0);
    });
}

async function sac_draw(sac) {
    const canv = sac.querySelector('.sac-img');
    const color = sac.dataset.colorCode.split(',');
    let imgs, base;
    switch (sac.dataset.sacName) {
        case '튼튼한 달걀 주머니':
            imgs = await loadImages(['Egg_base', 'Egg_L', 'Egg1']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 감자 주머니':
            imgs = await loadImages(['Potato_base', 'Potato_L', 'Potato1']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 옥수수 주머니':
            imgs = await loadImages(['Corn_base', 'Corn_L', 'Corn1']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 밀 주머니':
            imgs = await loadImages(['Wheat_base', 'Wheat_L', 'Wheat1']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 보리 주머니':
            imgs = await loadImages(['Barley_base', 'Barley_L', 'Barley1']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 양털 주머니':
            imgs = await loadImages(['Wool_base', 'Wool_L', 'Wool1', 'Wool2']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 거미줄 주머니':
            imgs = await loadImages(['Cobweb_base', 'Cobweb_L', 'Cobweb1', 'Cobweb2', 'Cobweb3']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1], imgs[4], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 가는 실뭉치 주머니':
            imgs = await loadImages(['Thin_base', 'Thin_L', 'Thin1', 'Thin2', 'Thin3']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1], imgs[4], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 굵은 실뭉치 주머니':
            imgs = await loadImages(['Thick_base', 'Thick_L', 'Thick1', 'Thick2', 'Thick3']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1], imgs[4], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 저가형 가죽 주머니':
            imgs = await loadImages(['Leather_base', 'Leather_L', 'Leather1', 'Leather2', 'Leather_1', 'Leather_1o', 'Leather_1i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 일반 가죽 주머니':
            imgs = await loadImages(['Leather_base', 'Leather_L', 'Leather1', 'Leather2', 'Leather_2', 'Leather_2o', 'Leather_2i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 고급 가죽 주머니':
            imgs = await loadImages(['Leather_base', 'Leather_L', 'Leather1', 'Leather2', 'Leather_3', 'Leather_3o', 'Leather_3i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 최고급 가죽 주머니':
            imgs = await loadImages(['Leather_base', 'Leather_L', 'Leather1', 'Leather2', 'Leather_4', 'Leather_4o', 'Leather_4i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 저가형 옷감 주머니':
            imgs = await loadImages(['Cloth_base', 'Cloth_L', 'Cloth1', 'Cloth2', 'Cloth_1', 'Cloth_1o', 'Cloth_1i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 일반 옷감 주머니':
            imgs = await loadImages(['Cloth_base', 'Cloth_L', 'Cloth1', 'Cloth2', 'Cloth_2', 'Cloth_2o', 'Cloth_2i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 고급 옷감 주머니':
            imgs = await loadImages(['Cloth_base', 'Cloth_L', 'Cloth1', 'Cloth2', 'Cloth_3', 'Cloth_3o', 'Cloth_3i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 최고급 옷감 주머니':
            imgs = await loadImages(['Cloth_base', 'Cloth_L', 'Cloth1', 'Cloth2', 'Cloth_4', 'Cloth_4o', 'Cloth_4i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 저가형 실크 주머니':
            imgs = await loadImages(['Silk_base', 'Silk_L', 'Silk1', 'Silk2', 'Silk_1', 'Silk_1o', 'Silk_1i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 일반 실크 주머니':
            imgs = await loadImages(['Silk_base', 'Silk_L', 'Silk1', 'Silk2', 'Silk_2', 'Silk_2o', 'Silk_2i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 고급 실크 주머니':
            imgs = await loadImages(['Silk_base', 'Silk_L', 'Silk1', 'Silk2', 'Silk_3', 'Silk_3o', 'Silk_3i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 최고급 실크 주머니':
            imgs = await loadImages(['Silk_base', 'Silk_L', 'Silk1', 'Silk2', 'Silk_4', 'Silk_4o', 'Silk_4i']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1]);
            base = await draw_add(canv, base, imgs[4], imgs[5], imgs[6], color[2]);
            await draw_plus(canv, base);
            break;
        case '튼튼한 꽃바구니':
            imgs = await loadImages(['Flower_base', 'Flower_L', 'Flower1', 'Flower2', 'Flower3']);
            base = await draw(canv, imgs[0], imgs[1], imgs[2], color[0], imgs[3], color[1], imgs[4], color[2]);
            await draw_plus(canv, base);
            break;
    }
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
            const target_code = result_box.dataset.colorCode;
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
                thimg.dataset.grayScale = true;
                thimg.getContext('2d').clearRect(0, 0, 48, 48);
            });
            thumbnail_channel.forEach(thch => {
                thch.innerText = '';
            });
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
                        if (thumbnail_img[i].dataset.grayScale == 'true') {
                            thumbnail_img[i].dataset.grayScale = false;
                            thumbnail_img[i].getContext('2d').drawImage(sac.querySelector('.sac-img'), 0, 0);
                        }

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

async function draw(canv, base, L, mask1, color1, mask2, color2, mask3, color3) {
    const ctx = canv.getContext('2d');
    const baseData = new ImageData(
        new Uint8ClampedArray(base.data),
        base.width, base.height
    );
    const c1 = hex2dec_color(color1);
    const c2 = color2 !== undefined ? hex2dec_color(color2) : 'FFFFFF';
    const c3 = color3 !== undefined ? hex2dec_color(color3) : 'FFFFFF';
    const plus = imageCache['Plus'];

    for (let i = 0; i < baseData.data.length; i += 4) {
        if (mask1 !== undefined) {
            const brightness = mask1.data[i];
            if (brightness !== 0) {
                baseData.data[i] = Math.max(0, baseData.data[i] + c1[0] - 255);
                baseData.data[i +1] = Math.max(0, baseData.data[i +1] + c1[1] - 255);
                baseData.data[i +2] = Math.max(0, baseData.data[i +2] + c1[2] - 255);
            }
        }
        if (mask2 !== undefined) {
            const brightness = mask2.data[i];
            if (brightness !== 0) {
                baseData.data[i] = Math.max(0, baseData.data[i] + c2[0] - 255);
                baseData.data[i +1] = Math.max(0, baseData.data[i +1] + c2[1] - 255);
                baseData.data[i +2] = Math.max(0, baseData.data[i +2] + c2[2] - 255);
            }
        }
        if (mask3 !== undefined) {
            const brightness = mask3.data[i];
            if (brightness !== 0) {
                baseData.data[i] = Math.max(0, baseData.data[i] + c3[0] - 255);
                baseData.data[i +1] = Math.max(0, baseData.data[i +1] + c3[1] - 255);
                baseData.data[i +2] = Math.max(0, baseData.data[i +2] + c3[2] - 255);
            }
        }
        if (L !== undefined) {
            baseData.data[i] = Math.min(baseData.data[i] + L.data[i], 255);
            baseData.data[i + 1] = Math.min(baseData.data[i + 1] + L.data[i + 1], 255);
            baseData.data[i + 2] = Math.min(baseData.data[i + 2] + L.data[i + 2], 255);
        }
    }
    ctx.putImageData(baseData, 0, 0);
    return baseData;
}
async function draw_add(canv, base, mask, l, s, color) {
    const ctx = canv.getContext('2d');
    const c = hex2dec_color(color);

    for (let i=0; i<base.data.length;i+=4) {
        const brightness = mask.data[i];
        if (brightness !== 0) {
            base.data[i] = Math.max(0, Math.min(c[0] + l.data[i], 255) - s.data[i]);
            base.data[i+1] = Math.max(0, Math.min(c[1] + l.data[i+1], 255) - s.data[i+1]);
            base.data[i+2] = Math.max(0, Math.min(c[2] + l.data[i+2], 255) - s.data[i+2]);
        }
    }
    ctx.putImageData(base, 0, 0);
    return base;
}
async function draw_plus(canv, base) {
    const ctx = canv.getContext('2d');
    const plus = imageCache['Plus'];
    for (let i=0;i<base.data.length;i+=4) {
        if (plus.data[i+3] !== 0) {
            base.data[i] = plus.data[i];
            base.data[i+1] = plus.data[i+1];
            base.data[i+2] = plus.data[i+2];
            base.data[i+3] = plus.data[i+3];
        }
    }
    ctx.putImageData(base, 0, 0);
    return base;
}
async function loadImages(urls) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", {willReadFrequently: true});

    const promises = urls.map(async (url) => {
        if (imageCache[url]) {
            return imageCache[url];
        }

        const img = new Image();
        img.src = '/static/layer/' + url + '.png';

        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        imageCache[url] = imageData;
        return imageData;
    });

    return Promise.all(promises);
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