$(document).ready(function() {
  var setChartUserAwakeDate = function(beginDate, endDate, converDate, chart) {
      $.ajax({
        url: '/statistics/operative/oneWeekUserStatistics',
        type: 'GET',
        data: {
          beginDate: beginDate,
          endDate: endDate
        },
        dataType: 'json'
      }).done(function(json) {
        if (json.status === false) {
          toastr.error(json.message);
        }
        var data = json.data;
        console.log(data)
        chart.series[0].update({
          data: data,
          pointStart: Date.UTC(converDate.year, converDate.month, converDate.date)
        }, true)
      })
    }


    $.ajax({
      url: '/statistics/operative/UserNumberStatistics',
      type: 'GET',
      dataType: 'json'
    }).done(function(json) {
      console.log(json)
      if (json.status === false) {
        toastr.error(json.message);
      }
      var data = json.data;
      $("#userNumber").html(data.count);
    })
  var chart = new Highcharts.Chart({
      chart: {
            height: 550,
            type: 'line',
            borderWidth: 1,
            shadow:true,
            renderTo: 'chart'
        },
        credits: {
          enabled: false
        },
        title: {
            text: '日新增用户'
        },
      plotOptions: {
        series: {
          pointStart: [],
          pointInterval: 24 * 3600 * 1000 // one day
        }
      },
      xAxis: {
           type: 'datetime',
           dateTimeLabelFormats: {
             day:"%Y-%b-%e"
           }
       },

        yAxis: {
          title: {
              text: '用户数'
          },
          tickPositions: [0, 100, 200, 500, 1000,2000]
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
          name: '日新增用户数',
          data: []
      }]
    });
    var converAwake = moment().subtract(6, 'days')
    var converDate = {
      year: converAwake.year(),
      month: converAwake.month(),
      date: converAwake.date()
    }
    setChartUserAwakeDate('', '', converDate, chart)
    var defaultTime  = moment().year() + '年'+ parseInt(moment().month() + 1 )+ '月' + moment().date() + '日';
    console.log(defaultTime)
    $('#dateInput').val(defaultTime)
    $('.input-group.date').datepicker({
    autoclose: true,
    todayBtn: 'linked',
    language: 'zh-CN',
    clearBtn: true,
    // orientation: "bottom right",
    endDate: "d",
  }).on('changeDate', function(ev) {
    var selTime = ev.date;
    var selectTime =  moment(selTime)
    var  endDate = selectTime.year() + '-' + parseInt(selectTime.month() + 1 ) + '-' + selectTime.date();
    var converAwake = selectTime.subtract(6, 'days')
    var  beginDate = converAwake.year() + '-' + parseInt(converAwake.month() + 1) + '-' + converAwake.date();
    var converDate = {
      year: converAwake.year(),
      month: converAwake.month() + 1,
      date: converAwake.date()
    }
    setChartUserAwakeDate(beginDate, endDate, converDate, chart)
  })
});
