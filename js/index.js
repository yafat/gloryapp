var mdb = {"glory":{loginid:'glory', passwd:'glory'}};
var minfo = {loginid:'glory', passwd:'glory'};
//var host = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
var host = "glory.cloud-us.com";
var port = 3000;
var timeout = 2000;
var socket = new io.Socket();
var data = "-- data to be sent --",
key = "",
proc = "",
stat = "",
pic_load="N",
pic_file="face.bmp",
cur_page="",
makeup_style=1,
mask_w = 230,
mask_h = 320,
screen_w = 320,
center_x = 160,
center_y = 180,
screen_w = 360,
socket_connected = false,
skip_connected = false;
var locations = {};
var mySwiper;
var def_face = "face_smooth.png";
var msg1="系統正在讀取您前次的拍攝記錄，請稍候。";
var msg2="請將您的頭臉按照說明書指示，就正確的位置後，系統會自動進行拍照";
var msg3="系統無法讀取您前次拍攝記錄，請重新拍攝。";
var swiper_html = "";
var action_bottom = 0;
var glory_url = "http://glory.cloud-us.com";
var ts;
$(function(){
    window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = '您是否確定要離開應用程式？';
        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });
    /*
    if(location.port == 3000){
        host = location.hostname+(location.port ? ':'+location.port: '');
    }
    */
    $('#host').val(host);
    $('#port').val(port);
    screen_w = $(window).width();
    center_x = parseInt(screen_w/2);
    
    $('#togglePoints').click(function(){
        var ht = $(this).html();
        if(ht == 'Show'){
            $(this).html('Hide');
            $('.sho-points').show();
        }else{
            $(this).html('Show');
            $('.sho-points').hide();
        }
    });
    $('#debug').click(function(){
        $('#msg-code').toggle();
    });
    $("body").on("click touchend", '.swiper-slide .nav a', function (e) {
        var target = $(this).attr('aria-controls');
        $(this).parents('.swiper-slide').find('.tab-pane').hide();
        $(this).parents('.swiper-slide').find('.' + target).show();
    });
    $("body").on("click touchend", '.style-colors li', function(){
        var cstyle = $(this).parents('.swiper-slide').attr('cstyle');
        var step = $(this).parents('.style-colors').attr('step');
        var cnum = $(this).attr('cnum');
        show_color_plate(cstyle, step, cnum);
    });
    $("body").on("click touchend", '.swiper-slide h3', function (e) {
        if($('.picture-actions').hasClass('mvd')){
            $('.picture-actions').removeClass('mvd').animate({'bottom':action_bottom});
        }else{
            $('.picture-actions').addClass('mvd').animate({'bottom':'0px'});
        }
    });
    $("body").on("click touchend", '#logout', function(){
        logout();
    });
    action_bottom = $('.picture-actions').css("bottom");
    show_page('.pag-init');
});
function show_page(target_page){
    if(!target_page) target_page = cur_page;
    if(target_page != '.pag-msg') cur_page = target_page;
    toggle_slide_menu(true);
    $('.pag').hide();
    $('.modal').modal('hide'); 
    $(target_page).show();
    init_page(target_page);
}
function init_page(target_page){
    def_face = 'http://' + host + '/'+pic_file+'?r='+get_random_str();
    if(target_page == '.pag-init'){
        var to_page = '.pag-login';
        if(Cookies.get('mdb')){
            mdb = Cookies.get('mdb');
        }
        if(Cookies.get('minfo')){
            minfo = Cookies.get('minfo');
            to_page = '.pag-index';
        }else if(minfo){
            to_page = '.pag-index';
        }
        try{
            socket.connect('http://'+host, {
                'port': port,
                'connect timeout': timeout,
                'reconnect': true,
                'reconnection delay': 2000,
                'max reconnection attempts': 3
            }); 
            //socket = io.connect();
            socket.on('connect', function() {
                socket_connected = true;
                socket.on('cmd', function (data) {
                    console.log('rec from socket io : '+data);
                    handelProc(data);
                });
                socket.on('msg', function (data) {
                    console.log('msg from socket io : '+data);
                    msgpage_show('發生錯誤', data);
                });
                socket.on('disconnect', function(){
                    socket_connected = false;
                    msgpage_show('發生錯誤', '與化妝主機之連線發生問題，正在嘗試重新連線中。如果一直無法重新連線，請關閉化妝機電源再開啟一次。若仍然持續無法連線，請洽客服人員處理。');
                });
            });
            $('.pag-init .logo').click(function(){
                
            });
            //setTimeout(function(){ show_page(to_page) }, 500);
        }catch(e){
            msgbox_show('連線錯誤', '系統發生未預期的錯誤，請嘗試更新您的設定。', function(){
                show_page('.pag-setup');
            });
            console.log(e);
            return false;
        }
    }else if(target_page == '.pag-login' || target_page == '.pag-index'){
        $('#camera-btn1').show();
        /*
        if(!socket_connected && !skip_connected){
            msgbox_show('連線錯誤', '系統無法正確連線到您的化妝機，請確認您的藍芽連線狀態。', [{text:'設定', click:function(){show_page('.pag-setup');}
            }, {text:'略過', click:function(){ skip_connected = true; show_page('.pag-index'); }
            }]);
            return false;
        }*/
    }else if(target_page == '.pag-setup'){
        $('#set_name').val(minfo.name);
        $('#set_email').val(minfo.email);
        $('#set_loginid').val(minfo.loginid);
        $('#set_passwd').val(minfo.passwd);
    }else if(target_page == '.pag-camera'){
        startProc('prepare_face');
    }else if(target_page == '.pag-picture'){
        if(!mySwiper){
            swiper_html = $('#swiper-container').html();
            mySwiper = new Swiper ('.swiper-container', {
              loop: true,
              onSlideChangeEnd: changeMakeup
            });
        }
        center_x = 160;
        center_y = 180;
        $('#face-img').load(function() {
            face_loaded();
        }).attr('src', def_face);
    }else if(target_page == '.pag-chk-inks'){
        if(ts) clearTimeout(ts);
        $('.inks').html('');
        $('.swiper-slide-active .tab-content li').each(function(){
            var cnum = $(this).attr('cnum');
            var pclass = $(this).attr('class');
            var color_btn = '<div class="color-choose-btn '+pclass+' cnum'+cnum+'" ></div>';
            $('.inks').append(color_btn);
        });
        var s = 0;
        ts = setTimeout(check_ink(0), 1000);
        /*
        if($('.err-color:visible').length > 0){ //color-choose-btn
            msgbox_show('色匣不符合','您所設置的色匣不符合本妝感的色匣配置，請您參考畫面上的提示更換正確的色匣後，按「重新整理」再試一次。');
        }*/
    }else if(target_page == '.pag-makeup'){
        startProc('select_style');
    }
}
function face_loaded(){
    if(!locations["p1"]) get_landmark_locations();
    $('#photo-canvas').clearCanvas().drawImage({
      source: def_face,
      x: center_x, y: center_y,
      scale: 1
    });
}
function draw_face(snum){
    //var cur_host = 'http://' + host + '/images/simulate/';
    makeup_style = snum;
    var cur_host = 'img/';
    brush_left = cur_host+ 'brush_left'+snum+'.png?r='+get_random_str();
    brush_right = cur_host+ 'brush_right'+snum+'.png?r='+get_random_str();
    eye_left = cur_host+ 'eye_left'+snum+'.png?r='+get_random_str();
    eye_right = cur_host+ 'eye_right'+snum+'.png?r='+get_random_str();
    //var loc = get_draw_locs();
    var brush_loc = cal_brush_loc();
    var eye_loc = cal_eye_loc();
    //console.log(brush_loc);
    //console.log(eye_loc);
    $('#photo-canvas').clearCanvas().drawImage({
          source: def_face,
          x: center_x, y: center_y,
          scale: 1
    }).drawImage({
        source: brush_left,
        x: brush_loc.blx, y: brush_loc.bly,
        scale: brush_loc.blr,
        rotate: brush_loc.bln,
        opacity: 0.6,
        layer: true,
        fromCenter: true,
        groups: ['makeups'],
        name: 'brushleft'
    }).drawImage({
        source: brush_right,
        x: brush_loc.brx, y: brush_loc.bry,
        scale: brush_loc.brr,
        rotate: brush_loc.brn,
        opacity: 0.6,
        layer: true,
        fromCenter: true,
        groups: ['makeups'],
        name: 'brushright'
    }).drawImage({
        source: eye_left,
        x: eye_loc.elx, y: eye_loc.ely,
        scale: 0.6,
        opacity: 0.7,
        layer: true,
        fromCenter: true,
        groups: ['makeups'],
        name: 'eyeleft'
    }).drawImage({
        source: eye_right,
        x: eye_loc.erx, y: eye_loc.ery,
        scale: 0.6,
        opacity: 0.7,
        layer: true,
        fromCenter: true,
        groups: ['makeups'],
        name: 'eyeright'
    });
}
function share_return(){
    $('#style-share').animate({'top':'100%'}, function(){ $('#style-share').hide(); });
}
function save_return(){
    $('#style-save').animate({'top':'100%'}, function(){ $('#style-save').hide(); });
}
function share_style(){
     $('#style-share').show().animate({'top':'56px'});
}
function save_style(){
     $('#style-save').show().animate({'top':'0'});
}
function do_save_style(){
    var new_style_name = $('#style_name').val();
    var new_slide = mySwiper.slides[mySwiper.activeIndex];
    var obj_slide = $(new_slide).clone().attr('id', new_style_name);
    obj_slide.find('h3').html(new_style_name);
    var obj_slide_html = obj_slide[0].outerHTML;
    var html = '<div class="swiper-container choose-makeup"></div>';
    //var new_swiper = $(html).append(swiper_html).append(slide);
    mySwiper.appendSlide(obj_slide_html);
    mySwiper.update();
    save_return();
}
function correct_ink(){
    if($('.err-color').length > 0){
        $('.err-color').remove(); 
        $('#btn-start-makeup').html('開始化妝'); 
    }else{
        show_page('.pag-makeup');
    }
}
function share_social(){

}
function handle_no_pic(){
    if(pic_load == "N"){
        pic_load = "X";
        $('#photo-msg-text').html(msg3);
        $('#camera-btn1').html('拍攝照片').show();
        $('#camera-btn2').hide();
        $('.photo-msg-loader').css('opacity',0);
    }
}

function send(str) {
    socket.emit('cmd', str);
}
function startProc(cmd){
    $('#msg-code').html(cmd);
    if(cmd == 'prepare_face'){
        document.getElementById('audio').setAttribute("src", "voice/001.m4a");
        document.getElementById('audio').play();
        document.getElementById('audio').addEventListener("ended", start_prepare_pic);
    }else if(cmd == 'prepare_pic'){
        $('#msg-code').html('enter prepare_pic');
        document.getElementById('audio').setAttribute("src", "voice/002.m4a");
        document.getElementById('audio').play();
        document.getElementById('audio').addEventListener("ended", start_get_pic);
        $('#msg-code').html('finish prepare_pic');
    }else if(cmd == 'makeup_complete'){
        document.getElementById('audio').setAttribute("src", "voice/006.m4a");
        document.getElementById('audio').play();
        document.getElementById('audio').addEventListener("ended", end_makeup_complete);
        $('#emerg-btn').hide();
        $('#back-index').show();
    }else if(cmd == 'finish_process'){
        $('#steps-msg').html('化妝程序完成。');
    }
    if(socket_connected){
        if(cmd == 'get_pic'){
            document.getElementById('audio').play();
            proc = "wait for pic";
            send("get_pic");
        }else if(cmd == 'select_style'){
            proc = "wait for makeup";
            send("select_type=" + makeup_style);
        }else if(cmd == 'stop_make_up'){
            proc = "stop makeup";
            send("stop_makeup");
            $('#steps-msg').html('緊急停止。');
            $('#emerg-btn').hide();
            $('#back-index').show();
        }
    }else{
        if(cmd == 'get_pic'){
            document.getElementById('audio').setAttribute("src", "voice/003.m4a");
            document.getElementById('audio').play();
            document.getElementById('audio').addEventListener("ended", end_get_pic);
        }else if(cmd == 'select_style'){
            document.getElementById('audio').setAttribute("src", "voice/005.m4a");
            document.getElementById('audio').play();
            document.getElementById('audio').addEventListener("ended", end_make_up);
        }else if(cmd == 'stop_make_up'){
            $('#steps-msg').html('緊急停止。');
            $('#emerg-btn').hide();
            $('#back-index').show();
        }
    }
}
function start_prepare_pic(){
    document.getElementById('audio').setAttribute("src", "");
    document.getElementById('audio').removeEventListener("ended", start_prepare_pic);
    countdown(3, '#pag-camera-msg', "prepare_pic" );
}
function start_get_pic(){
    $('#camera-btn1').hide();
    document.getElementById('audio').setAttribute("src", "");
    document.getElementById('audio').removeEventListener("ended", start_prepare_pic);
    document.getElementById('audio').removeEventListener("ended", start_get_pic);
    countdown(3, '#pag-camera-msg', "get_pic" );
}
function end_get_pic(){
    document.getElementById('audio').removeEventListener("ended", end_get_pic);
    handelProc('get_pic_ok');
}
function end_make_up(){
    document.getElementById('audio').removeEventListener("ended", end_make_up);
    countdown(3, '#steps-msg', "makeup_complete" );
}
function end_makeup_complete(){
    document.getElementById('audio').removeEventListener("ended", end_makeup_complete);
    countdown(3, '#steps-msg', "finish_process" );
}
function countdown(s, ele, func){
    var f = function(){
        $(ele).text(s);
        s--;
        if(s > 0){
            setTimeout(f, 1000);
        }else{
            $(ele).text('');
            startProc(func);
        }
    };
    f();
}

function handelProc(rcv){
    if(rcv == 'get_pic_ok'){
        //讀取圖片
        var pic_origin = 'http://' + host + '/face.bmp?r='+get_random_str();
        var pic_whiten = 'http://' + host + '/face_whiten.jpg?r='+get_random_str();
        $('#pic_origin').attr('src', pic_origin);
        $('#pic_whiten').attr('src', pic_whiten);
        show_page('.pag-picture');
        get_landmark_locations();
        document.getElementById('audio').setAttribute("src", "voice/004.m4a");
        document.getElementById('audio').play();
        return;
    }else if(rcv == 'step1'){
        //切換到步驟1
        $('.sho-pic').hide();
        $('.steps').show();
        $('.steps-msg').html('步驟 1 &gt;&gt;&gt;');
    }else if(rcv == 'step2'){
        $('.steps').show();
        $('.steps-msg').html('步驟 2 &gt;&gt;&gt;');
    }else if(rcv == 'step3'){
        $('.steps').show();
        $('.steps-msg').html('步驟 3 &gt;&gt;&gt;');
    }else if(rcv == 'makeup_complete'){
        $('.steps').show();
        $('.steps-msg').html('步驟完成');
        $('.steps-back').show();
    }
}
function backToStart(){
    $('.socket-data').show();
    $('.sho-pic, .steps').hide();
}
function get_random_str(){
    var s = Math.floor((Math.random() * 10000) + 1);
    return s.toString();
}
function get_landmark_locations(){
    var s = '';
    var fpath = 'http://' + host + '/2d_landmarks.txt?r='+get_random_str();
    $.get(fpath, function(res){
        try{
            var lines = res.split("\n");
            var numLines = lines.length;
            var i;
            var n = 0;
            // parse phrases
            for (i = 2; i < numLines; i++) {
              var line = lines[i];
              if (line.length <= 0) {
                continue;
              } else {
                //拆解這行變成X,Y兩個值
                var points = line.split(" ");
                var px = parseInt(points[0]);
                var py = parseInt(points[1]);
                var point =  {'x':px, 'y':py};
                console.log('p' + n + ':' + px+','+py);
                point= fix_locations(point);
                n++;
                locations['p' + n] =point;
              }
            }
            try{
                draw_landmarks();
            }catch(e){
                alert('error test draw!!');
                console.log(e);
            }
        }catch(e){
            alert('error happend!! res=' + res);
            console.log(e);
        }
    });
}
function draw_landmarks(){
    var targetarray = ['p54','p31','p60', 'p70', 'p33','p64', 'p11','p15', 'p13','p17','p72', 'p19','p23', 'p21','p25', 'p75'];
    var cls, ctxt;
    $.each(locations, function(k, v){
        cls = '';
        ctxt = '';
        if(targetarray.indexOf(k) >= 0){
            cls = 'bigp';
            //ctxt = k;
        }
        draw_point(k, v, cls, ctxt);
    });
}
function draw_point(k, v, cls, ctxt){
    var p = '<div class="lmp '+cls+'" id="'+k+'">'+ctxt+'</div>';
    var pobj = $(p);
    pobj.appendTo('.sho-points').css({'position':'absolute', 'top':v.y+'px', 'left':v.x+'px'});
}
//腮紅位置計算
function cal_brush_loc(){
    var pla = locations['p54'];//右耳上
    var plb = locations['p31'];//右鼻翼外側
    var plc = locations['p60'];//右下頰
    var pra = locations['p70'];//左耳上
    var prb = locations['p33'];//左鼻翼外側
    var prc = locations['p64'];//左下頰
    var loc = {};
    loc.bld = (plb.x - pla.x) ;
    var blxo = loc.bld / 6; //左側的腮紅中心位移計算
    loc.blx = (pla.x + plb.x) / 2 - blxo; 
    loc.bly = (pla.y + plb.y) / 2 + 12;
    loc.blr = loc.bld / 80; // 左側的腮紅縮放計算
    loc.bln = (plc.x - pla.x) / ( plb.x - pla.x) * 15; //左側腮紅旋轉角度計算(負值就逆旋轉)
    draw_point('bl', {x:loc.blx, y:loc.bly}, 'bigp', 'BL');

    loc.brd = (pra.x - prb.x) ;
    var brxo = loc.bld / 5.5; //左側的腮紅圓心位移計算
    loc.brx = (pra.x + prb.x) / 2;
    loc.bry = (pra.y + prb.y) / 2 + 12;
    loc.brr = loc.brd / 80; // 右側的腮紅縮放計算
    loc.brn = (prc.x - pra.x) / ( prb.x - pra.x) * -15; //右側腮紅旋轉角度計算(正值就逆旋轉)
    draw_point('br', {x:loc.brx, y:loc.bry}, 'bigp', 'BR');
    return loc;
}
//眼影位置計算
function cal_eye_loc(){
    var ple4 = locations['p71'];//右眉下中
    var ple5 = locations['p15'];//右眼外側
    var ple6 = locations['p11'];//右眼內側
    var ple7 = locations['p13'];//右眼上中

    var pre4 = locations['p75'];//左眉下中
    var pre5 = locations['p19'];//左眼內側
    var pre6 = locations['p23'];//左眼外側
    var pre7 = locations['p21'];//左眼上中
    var loc = {};
    loc.elxd = ple6.x - ple5.x; //右眼區寬度
    loc.elyd = ple7.y - ple4.y; //右眼區高度
    loc.elx = ple7.x - loc.elxd / 5;
    loc.ely = (ple7.y + ple4.y) / 2 + loc.elyd / 3;
    loc.erxd = pre6.x - pre5.x //左眼寬度
    loc.eryd = pre7.y - pre4.y; //右眼區高度
    loc.erx = pre7.x + loc.erxd / 5;
    loc.ery = (pre7.y + pre4.y) / 2 + loc.eryd / 3;
    return loc;
}

function fix_locations(p){
    var new_p = {};
    new_p.x = p.x -160;
    new_p.y = p.y;
    return new_p;
}
function get_text(furl, postdata, proc_handler){
    $.ajax({
        method: "POST",
        url: furl,
        data: postdata,
    }).done(function( res ) {
        if(typeof(proc_handler) === 'function') proc_handler(res);
    });
}
function msgbox_show(title, content, buttons){
    $('.btn-newadd').remove();
    $('#btn-close-alert').show();
    $('#alert-title').html(title);
    $('#alert-content').html(content);
    $('#alert-modal').modal('show');
    if(buttons && Array.isArray(buttons)){
        $('#btn-close-alert').hide();
        $.each(buttons, function(k,v){
            var btn = '<a class="btn btn-primary btn-newadd" >'+v.text+'</a>';
            $(btn).click(v.click).appendTo('.modal-footer');
        });
    }
}
function msgpage_show(title, data){
    $('#pag-msg-title').html(title);
    $('#pag-msg-content').html(data);
    show_page('.pag-msg');
}
function data_receiver(cmd){
    if(cmd.substring(0,10) == 'get_pic_ok'){
        alert('start relaod picture');
        show_page('.pag-camera');
    }
}
function login(){
    var loginid = $('#loginid').val();
    var passwd = $('#passwd').val();
    if(!loginid || !passwd){
        msgbox_show('缺少必填的資料', '請輸入帳號及密碼後，再按下「登入」按鈕，謝謝！');
        return false;
    }
    if(mdb[loginid]){
        if(mdb[loginid].passwd != passwd){
            msgbox_show('登入失敗', '您輸入的帳號不存在，請檢查是否正確輸入後再試一次。');
            return false;
        }else{
            minfo = mdb[loginid];
            Cookies.set('minfo', minfo, { expires: 365 });
            show_page('.pag-index');
        }
    }else{
        msgbox_show('登入失敗', '您輸入的帳號不存在，請檢查是否正確輸入後再試一次。');
        return false;
    }
    /*
    get_data("do.php?cmd=login", {loginid:loginid, passwd:passwd}, function(res){
        if(res.minfo){
            Cookies.set('minfo', res.minfo, { expires: 365 });
            show_page('.pag-index');
        } 
    });
    */
}
function register(){
    var loginid = $('#reg_loginid').val();
    var passwd = $('#reg_passwd').val();
    var name = $('#reg_name').val();
    var email = $('#reg_email').val();
    if(!loginid || !passwd || !name || !email){
         msgbox_show('缺少必填的資料', '請在輸入完整資料後，再按下「送出」按鈕，謝謝！');
         return false;
    }
    if(mdb[loginid]){
        msgbox_show('註冊失敗', '您要使用的帳號已經存在，請更換帳號後再試一次。');
        return false;
    }
    var new_minfo = {loginid:loginid, passwd:passwd, name:name, email:email};
    mdb[loginid] = new_minfo;
    Cookies.set('minfo', new_minfo, { expires: 365 });
    show_page('.pag-index');
    /*
    get_data(glory_url + "/do.php?cmd=register", {loginid:loginid, passwd:passwd, name:name, email:email}, function(res){
        if(res.minfo){
            Cookies.set('minfo', res.minfo, { expires: 365 });
            show_page('.pag-index');
        } 
    });*/
    
}
function logout(){
    minfo = {};
    Cookies.remove('minfo');
    show_page('.pag-login');
}
function toggle_slide_menu(selected){
    $('#slidemenu').stop().animate({
        left: selected ? '-210px' : '0px'
    });
    $('#navbar-height-col').stop().animate({
        left: selected ? '-210px' : '0px'
    });
    $('.pag:visible').stop().animate({
        left: selected ? '0px' : '210px'
    });
    $(this).toggleClass('slide-active', !selected);
    $('#slidemenu').toggleClass('slide-active');
    $('.pag:visible, .navbar, body, .navbar-header').toggleClass('slide-active');
}
function setup(){
    show_page('.pag-index');
}
function show_color_plate(cstyle, step, cnum){
    var fund_array = ['fundation1', 'fundation2', 'fundation3'];
    var brush_array = ['p176','p1685','p494','p170','p1767','p177'];
    var eye_array = ['p162','p163','p655','p182','p244','p7525','p538','p535','p424'];
    var cur_array;
    if(step == 'fundation'){
        cur_array = fund_array;
    }else if(step == 'brush'){
        cur_array = brush_array;
    }else{
        cur_array = eye_array;
    }
    $('.color-plate div').remove();
    $('.color-plate').attr('cstyle', cstyle).attr('step', step).attr('cnum', cnum);
    $.each(cur_array, function(k,v){
        var div = '<div class="color-choose-btn '+v+'" onclick="choose_color(this);"></div>';
        $('.color-plate').append(div);
    });
    $('.color-plate').fadeIn();
}
function change_color(cstyle, step, cnum, classname){
    var newclass = classname.replace("color-choose-btn ", "");
    $('.swiper-slide[cstyle="'+cstyle+'"]').find('li[cnum="'+cnum+'"]').removeClass().addClass(newclass);
    $('.color-plate').hide();
}
function changeMakeup(curswiper){
    var slide = curswiper.slides[curswiper.activeIndex];
    var cstyle = $(slide).attr('cstyle');
    if(parseInt(cstyle) > 0){
        draw_face(cstyle);
    }else{
        $('#photo-canvas').clearCanvas().drawImage({
            source: def_face,
            x: center_x, y: center_y,
            scale: 1
        });
    }
}
function check_ink(s){
    $('.inks .color-choose-btn').eq(s).html('<div class="ink-chk glyphicon glyphicon-ok"></div>');
    s++;
    if(s <= 7){
        ts = setTimeout(function(){check_ink(s)}, 1000);
    }else{
        show_page('.pag-makeup');
    }
}
function show_list() {
    var selected = $('#slidemenu').hasClass('slide-active');
    toggle_slide_menu(selected);
}
function choose_color(obj){
    var cstyle = $('.color-plate').attr('cstyle');
    var step = $('.color-plate').attr('step');
    var cnum = $('.color-plate').attr('cnum');
    var classname = $(obj).attr('class');
    change_color(cstyle, step, cnum, classname);
}