$(document).ready(function() {
    var bar = $('#header_voip_bar');

    var voipaccount = bar.find('input[name="voipaccount"]').val();
    var voippwd = bar.find('input[name="voippwd"]').val();
    var agentid = bar.find('input[name="agentid"]').val();
    var agentmobile = bar.find('input[name="agentmobile"]').val();
    var statusicon = bar.find('#status_icon');
    var voip_workstatus = bar.find('#voip_workstatus');
    var voip_answer = bar.find('#voip_answer');
    var voip_screen = bar.find('#voip_screen');
    var voip_transfer = bar.find('#voip_transfer');
    var incomecall_container = bar.find('#incomecall');
    var hangup_container = bar.find('#hangupcall');
    var obcall_container = bar.find('#obcall');
    var transfer_container = bar.find('#transfercall');
    var callnumber = $('#callnumber');
    var autoanswer = false;
    var autoscreen = false;
    var autotransfer = false;

    var popscreen = function(callphone){
        //e.preventDefault();
        Metronic.scrollTop();
        var pageContentBody = $('.page-content .page-content-body');
        if (Metronic.getViewPort().width < 992 && $('.page-sidebar').hasClass("in")) { // close the menu on mobile view while laoding a page
            $('.page-header .responsive-toggler').click();
        }
        Metronic.startPageLoading();
        jQuery.ajax({
            url: '/custom/query/search.html',
            type: 'post',
            cache: false,
            dataType: "html",
            data: {
                type:1,
                key:callphone
            },
            success: function (res) {
                Metronic.stopPageLoading();
                pageContentBody.html(res);
                Layout.fixContentHeight(); // fix content height
                Metronic.initAjax(); // initialize core stuff
            },
            error: function (xhr) {
                Metronic.stopPageLoading();
                pageContentBody.html(xhr.responseText);
                Layout.fixContentHeight(); // fix content height
                Metronic.initAjax(); // initialize core stuff
            }
        });
    };

    var changestate = function(state,callback){
        $.ajax( {
            url:'/cloopen/voip/state',
            type:'post',
            cache:false,
            data:{
                agentid:agentid,
                state:state
            },
            dataType:'json',
            success:function(data) {
                if (data.success){
                    callback(null);
                } else {
                    callback('调用失败');
                }
            },
            error:function(){
                callback('调用错误');
            }
        });
    };

    var querycall = function(callback){
        $.ajax( {
            url:'/cloopen/voip/querycall',
            type:'post',
            cache:false,
            data:{
                agentid:agentid
            },
            dataType:'json',
            success:function(data) {
                if (data.success){
                    callback(null,{
                        callid:data.data.callid,
                        callnumber:data.data.callnumber
                    });
                } else {
                    callback('调用失败');
                }
            },
            error:function(){
                callback('调用错误');
            }
        });
    };

    var transfercall = function(callid,mobile,callback){
        $.ajax( {
            url:'/cloopen/voip/transfercall',
            type:'post',
            cache:false,
            data:{
                callid:callid,
                mobile:mobile
            },
            dataType:'json',
            success:function(data) {
                if (data.success){
                    callback(null);
                } else {
                    callback('调用失败');
                }
            },
            error:function(){
                callback('调用错误');
            }
        });
    };


    /*正在连接服务器中状态*/
    Cloopen.when_connecting(function(){
        statusicon.removeClass();
        statusicon.addClass('badge badge-danger');
        statusicon.text('连');
    });

    /*已经注册登录状态，通话结束也返回此状态*/
    Cloopen.when_connected(function(){
        statusicon.removeClass();
        statusicon.addClass('badge badge-success');
        statusicon.text('好');
        incomecall_container.hide();
        obcall_container.show();
        hangup_container.hide();
        transfer_container.hide();
        callnumber.text('');
    });

    /*呼出状态*/
    Cloopen.when_outbound(function(){
        statusicon.removeClass();
        statusicon.addClass('badge badge-primary');
        statusicon.text('出');
        hangup_container.show();
        incomecall_container.hide();
        obcall_container.hide();
        transfer_container.hide();
    });

    /*呼入状态*/
    Cloopen.when_inbound(function(){
        //查询呼入的号码和CALLID
        querycall(function(err,data){
            if (err){
                statusicon.removeClass();
                statusicon.addClass('badge badge-primary');
                statusicon.text('入');
                if (autoanswer){
                    Cloopen.accept();
                } else {
                    incomecall_container.show();
                    hangup_container.hide();
                    obcall_container.hide();
                    transfer_container.hide();
                }
            } else {
                if (autotransfer){
                    transfercall(data.callid,agentmobile,function(err){
                        if (err){
                            callnumber.text(data.callnumber);
                            statusicon.removeClass();
                            statusicon.addClass('badge badge-primary');
                            statusicon.text('入');
                            if (autoanswer){
                                Cloopen.accept();
                            } else {
                                incomecall_container.show();
                                hangup_container.hide();
                                obcall_container.hide();
                                transfer_container.find('a').data('callid',data.callid);
                                transfer_container.show();
                            }
                        }
                    });
                } else {
                    callnumber.text(data.callnumber);
                    statusicon.removeClass();
                    statusicon.addClass('badge badge-primary');
                    statusicon.text('入');
                    if (autoanswer){
                        Cloopen.accept();
                    } else {
                        incomecall_container.show();
                        hangup_container.hide();
                        obcall_container.hide();
                        transfer_container.find('a').data('callid',data.callid);
                        transfer_container.show();
                    }
                }
                //弹屏
                if (autoscreen){
                    popscreen(data.callnumber);
                }
            }
        });
    });

    /*通话中状态*/
    Cloopen.when_active(function(e){
        statusicon.removeClass();
        statusicon.addClass('badge badge-info');
        statusicon.text('通');
        hangup_container.show();
        obcall_container.hide();
        incomecall_container.hide();
        transfer_container.hide();
    });

    Cloopen.initByUser('voipcontainer',function(){
        changestate('true',function(err){
            if (!err || err == '调用失败'){
                voip_workstatus.find('.time').text('工作中');
                voip_workstatus.find('.details span').removeClass();
                voip_workstatus.find('.details span').addClass('label label-sm label-icon label-success');
                voip_workstatus.find('.details label').text('小休');
            }
        });
    },function(eventtype,eventdata){
        console.log(eventtype,eventdata);
    },voipaccount,voippwd);

    bar.find('#voip_call').on('click',function(){
        bootbox.prompt("请输入被叫号码", function(result) {
            if (result !== null) {
                var pattern=/(^(([0\+]\d{2,3}-)?(0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$)|(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)/;
                if(pattern.test(result)) {
                    callnumber.text(result);
                    Cloopen.invitetel(result,'4008446166');
                }
            }
        });
    });

    $(window).bind('beforeunload', function(){
        changestate('false',function(err){

        });
    });

    voip_workstatus.on('click',function(){
        var status = voip_workstatus.find('.time').text();
        if (status == '工作中'){
            changestate('false',function(err){
                if (!err || err == '调用失败'){
                    voip_workstatus.find('.time').text('休息中');
                    voip_workstatus.find('.details span').removeClass();
                    voip_workstatus.find('.details span').addClass('label label-sm label-icon label-default');
                    voip_workstatus.find('.details label').text('上班');
                }
            });
        } else {
            changestate('true',function(err){
                if (!err || err == '调用失败'){
                    voip_workstatus.find('.time').text('工作中');
                    voip_workstatus.find('.details span').removeClass();
                    voip_workstatus.find('.details span').addClass('label label-sm label-icon label-success');
                    voip_workstatus.find('.details label').text('小休');
                }
            });
        }
    });

    voip_answer.on('click',function(){
        if (autoanswer == true){
            autoanswer = false;
            voip_answer.find('.time').text('手动接听');
            voip_answer.find('.details label').text('设置为自动');
        } else {
            autoanswer = true;
            voip_answer.find('.time').text('自动接听');
            voip_answer.find('.details label').text('设置为手动');
        }
    });

    voip_screen.on('click',function(){
        if (autoscreen == true){
            autoscreen = false;
            voip_screen.find('.time').text('手动查询');
            voip_screen.find('.details label').text('设置为弹屏');
        } else {
            autoscreen = true;
            voip_screen.find('.time').text('自动弹屏');
            voip_screen.find('.details label').text('设置为手动');
        }
    });

    voip_transfer.on('click',function(){
        if (autotransfer == true){
            autotransfer = false;
            voip_transfer.find('.time').text('不转接');
            voip_transfer.find('.details label').text('设置为自动转接');
        } else {
            autotransfer = true;
            voip_transfer.find('.time').text('自动转接');
            voip_transfer.find('.details label').text('设置为不转接');
        }
    });

    incomecall_container.on('click','a',function(){
        Cloopen.accept();
    });

    hangup_container.on('click','a',function(){
        Cloopen.bye();
    });

    transfer_container.on('click','a',function(){
        transfercall($(this).data('callid'),agentmobile,function(err){
            if (err){
                alert('呼转失败!');
            }
        });
    });
});