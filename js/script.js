function register_form(frm, func_callback, func_before){
	$(frm).ajaxForm({
		beforeSubmit: func_before,
		success: function(ret){
			proc_ret(ret, func_callback);
		}
	});
}
function submit_form(frm, func_callback, func_before){
	$(frm).ajaxSubmit({
		beforeSubmit: func_before,
		success: function(ret){
			proc_ret(ret, func_callback);
		}
	});
}
function get_data(url, send_data, proc_handler, err_handler){
	$.ajax({
		url:url,
		type:'post',
		data:send_data,
		success:function(ret){
			proc_ret(ret, proc_handler, err_handler);
		}, 
		error:function(jq, err_status, err_string){
			console.log('get_data err_string: '+err_string);
		}
	});
}
function proc_ret(ret, proc_handler, err_handler){
	alert(ret);
	try{
		res = $.parseJSON(ret);
		console.log(res);
		if(res.status == 'ok'){
			if(res.msg) msgbox_show(res.msg);
			if(proc_handler){
				try{
					proc_handler(res);
				}catch(e){
					alert('要接續呼叫的指令碼發生錯誤！(PROC_HANDLER ERROR)');
					console.log(e);
				}
			}
			if(res.redirect){
				load_page(res.redirect);
			}
		}else if(res.status == 'err'){
			$('.has-error').removeClass('has-error');
			$('.error-icon').remove();
			if(res.errors){
				
				$.each(res.errors, function(k, v){
					var err_icon=$('<a class="error-icon glyphicon glyphicon-question-sign text-danger icon-error"></a>');
					err_icon.attr('title', v);
					if(res.target_modal){
						$('#'+res.target_modal+'-'+k).addClass('has-error').parent().append(err_icon);
					}else{
						$('input[name="' + k + '"]').addClass('has-error').parent().append(err_icon);
					}
				});
			}
			if(res.col){
				$('.inp_err').remove();
				$.each(res.col, function(k, v){
					$('#'+k).parent().append("<td class='inp_err' style='color:#F00;'>"+v+"</td>");
				});		
			}
			if(res.msg) {
				msgbox_show('發生錯誤', res.msg);
			}
			if(typeof(err_handler) === 'function') err_handler(res);
		}else{
			msgbox_show('沒有回傳值status，請聯絡程式人員處理！');
		}
	}catch(e){
		console.log(e);
		msgbox_show('系統錯誤，可能是連線中斷，請稍候再試！');
		
	}
}