/**
 * Created by jimmychou on 15/1/7.
 */
exports.list = function () {
    return [
    //   {
    //     name: 'custom',
    //     text: '客服管理',
    //     icon: 'fa fa-heart',
    //     childs:[{
    //         name: 'query',
    //         text: '客服查询'
    //     },{
    //         name: 'feedback',
    //         text: '用户反馈管理',
    //         childs:[{
    //             name:'deal',
    //             text:'处理反馈'
    //         }]
    //     },{
    //         name: 'voice',
    //         text:'用户语音留言管理',
    //         childs:[{
    //             name:'deal',
    //             text:'处理留言'
    //         }]
    //     },{
    //         name: 'account',
    //         text: '客服账号管理',
    //         childs:[{
    //             name:'add',
    //             text:'增加客服专员'
    //         },{
    //             name:'edit',
    //             text:'编辑客服专员'
    //         },{
    //             name:'del',
    //             text:'删除客服专员'
    //         }]
    //     },{
    //         name: 'phone',
    //         text: '语音记录管理'
    //     },{
    //         name: 'taobao',
    //         text: '淘宝订单录入'
    //     },{
    //         name:'taobaoaddr',
    //         text:'淘宝地址匹配'
    //     },{
    //         name: 'jingdong',
    //         text:'京东订单录入'
    //     },{
    //         name: 'nashui',
    //         text:'那谁订单录入'
    //     },{
    //         name:'daowei',
    //         text:'到位订单录入'
    //     }]
    // },{
    //     name: 'operation',
    //     text: '运营管理',
    //     icon: 'fa fa-database',
    //     childs: [{
    //         name: 'zone',
    //         text: '运营区域管理',
    //         childs:[{
    //             name:'edit',
    //             text:'修改城市'
    //         },{
    //             name:'district',
    //             text:'街道管理',
    //             childs:[{
    //                 name:'add',
    //                 text:'增加街道'
    //             },{
    //                 name:'edit',
    //                 text:'编辑街道'
    //             },{
    //                 name:'del',
    //                 text:'删除街道'
    //             }]
    //         }]
    //     },{
    //         name: 'site',
    //         text: '配送点管理',
    //         childs:[{
    //             name:'add',
    //             text:'增加配送点'
    //         },{
    //             name:'edit',
    //             text:'编辑配送点'
    //         },{
    //             name:'del',
    //             text:'删除配送点'
    //         }]
    //     },{
    //         name:'notify',
    //         text:'物流消息通知',
    //         childs:[{
    //             name:'broadcast',
    //             text:'发送广播'
    //         },{
    //             name:'send',
    //             text:'发送特定人员'
    //         }]
    //     },{
    //         name: 'menu',
    //         text: '微信菜单管理'
    //     },{
    //         name: 'coupon',
    //         text: '优惠券管理',
    //         childs:[{
    //             name:'add',
    //             text:'增加优惠券'
    //         }]
    //     },{
    //         name: 'couponsend',
    //         text:'批量发放优惠券'
    //     },{
    //         name: 'channel',
    //         text: '渠道管理',
    //         childs:[{
    //             name:'qrcode',
    //             text:'生成渠道二维码'
    //         }]
    //     }]
    // },{
    //     name:'finance',
    //     text:'财务管理',
    //     icon:'fa fa-money',
    //     childs:[{
    //         name:'refund',
    //         text:'待退费订单管理',
    //         childs:[{
    //             name:'deal',
    //             text:'处理退费'
    //         }]
    //     },{
    //         name:'refunded',
    //         text:'已退费订单管理'
    //     },{
    //         name:'commission',
    //         text:'待结算佣金管理',
    //         childs:[{
    //             name:'deal',
    //             text:'处理结算'
    //         }]
    //     },{
    //         name:'commissioned',
    //         text:'已结算佣金管理'
    //     }]
    // },{
    //     name:'market',
    //     text:'营销管理',
    //     icon:'fa fa-link',
    //     childs:[{
    //         name:'account',
    //         text:'营销专员资料管理',
    //         childs:[{
    //             name:'add',
    //             text:'增加营销专员'
    //         },{
    //             name:'edit',
    //             text:'编辑营销专员'
    //         },{
    //             name:'del',
    //             text:'删除营销专员'
    //         }]
    //     },{
    //         name:'agentall',
    //         text:'所有代理人管理',
    //         childs:[{
    //             name:'add',
    //             text:'增加代理人'
    //         },{
    //             name:'edit',
    //             text:'编辑代理人'
    //         },{
    //             name:'del',
    //             text:'删除代理人'
    //         }]
    //     },{
    //         name:'agent',
    //         text:'代理人资料管理',
    //         childs:[{
    //             name:'add',
    //             text:'增加代理人'
    //         },{
    //             name:'edit',
    //             text:'编辑代理人'
    //         },{
    //             name:'del',
    //             text:'删除代理人'
    //         }]
    //     },{
    //         name:'agentprofile',
    //         text:'代理人资料'
    //     },{
    //         name:'agentnosettled',
    //         text:'代理人未结算单'
    //     },{
    //         name:'agentsettling',
    //         text:'代理人等待结算单'
    //     },{
    //         name:'agentsettled',
    //         text:'代理人已结算单'
    //     }]
    // },{
    //     name:'user',
    //     text:'用户管理',
    //     icon:'fa fa-user',
    //     childs:[{
    //         name: 'list',
    //         text: '用户列表',
    //         childs:[{
    //             name:'detail',
    //             text:'用户详情'
    //         }]
    //     },{
    //         name: 'today',
    //         text: '今日用户列表',
    //         childs:[{
    //             name:'detail',
    //             text:'用户详情'
    //         }]
    //     },{
    //         name: 'coupon',
    //         text: '优惠券领取列表',
    //         childs:[{
    //             name:'detail',
    //             text:'用户详情'
    //         }]
    //     }]
    // },{
    //     name:'order',
    //     text:'订单管理',
    //     icon:'fa fa-bars',
    //     childs:[{
    //         name: 'query',
    //         text: '订单查询'
    //     },{
    //         name: 'list',
    //         text: '订单列表',
    //         childs:[{
    //             name:'comment',
    //             text:'订单备注'
    //         }]
    //     },{
    //         name:'expirein',
    //         text:'超期取鞋订单',
    //         childs:[{
    //             name:'comment',
    //             text:'订单备注'
    //         }]
    //     },{
    //         name:'expireout',
    //         text:'超期送鞋订单',
    //         childs:[{
    //             name:'comment',
    //             text:'订单备注'
    //         }]
    //     },{
    //         name:'expiretel',
    //         text:'未按时打电话订单'
    //     },{
    //         name:'nashui',
    //         text:'那谁订单列表'
    //     }]
    {
        name: 'statistics',
        text: 'DeerWar统计',
        icon: 'fa fa-archive',
        childs:[{
            name: 'circulates',
            text: '流通统计'
        },
        {
            name: 'operative',
            text: '运营统计'
        },
        {
            name: 'mallExchange',
            text: '商城兑换统计'
        }]
    },
    {
        name: 'officialarena',
        text: '官方竞技场',
        icon: 'fa fa-archive',
        childs:[{
            name: 'arena',
            text: '竞技场管理',
            childs:[{
                name: 'add',
                text: '增加竞技场'
            }, {
                name: 'edit',
                text: '编辑竞技场'
            }, {
                name: 'del',
                text: '删除竞技场'
            }]
        }]
    },
    {
      name: 'configuration',
      text: '配置',
      icon: 'fa fa-archive',
      childs:[{
          name: 'arenaconfig',
          text: '竞技参数配置'
      }]
    },
    {
      name: 'arenaquery',
      text: '竞技查询',
      icon: 'fa fa-archive',
      childs:[{
          name: 'resultquery',
          text: '竞技结果查询'
      }]
    },
    {
      name: 'exchang',
      text: '兑换',
      icon: 'fa fa-archive',
      childs:[{
          name: 'exchangemanage',
          text: '兑换管理'
      }]
    },
    {
        name: 'store',
        text: '商城管理',
        icon: 'fa fa-globe',
        childs:[{
            name:'property',  //商品属性
            text:'属性管理',
            childs:[{
                name: 'add',
                text: '增加属性'
            }, {
                name: 'edit',
                text: '编辑属性'
            }, {
                name: 'del',
                text: '删除属性'
            }]
        },{
            name:'propertyValue',
            text:'属性分类管理',
            childs:[{
                name: 'add',
                text: '增加属性种类'
            }, {
                name: 'edit',
                text: '编辑属性种类'
            }, {
                name: 'del',
                text: '删除属性种类'
            }]
        },
        {
            name:'product',
            text:'商品管理',
            childs:[{
                name: 'add',
                text: '增加商品'
            }, {
                name: 'edit',
                text: '编辑商品'
            }, {
                name: 'del',
                text: '删除商品'
            }]
        },
        {
            name:'productImage',
            text:'商品图片管理',
            childs:[{
                name: 'add',
                text: '增加商品图片'
            }, {
                name: 'edit',
                text: '编辑商品图片'
            }, {
                name: 'del',
                text: '删除商品图片'
            }]
        },
        {
            name:'productUnit',
            text:'商品单元管理',
            childs:[{
                name: 'add',
                text: '增加商品单元'
            }, {
                name: 'edit',
                text: '编辑商品单元'
            }, {
                name: 'del',
                text: '删除商品单元'
            }]
        }
      ]
    },
    {
        name: 'organization',
        text: 'DeerWar数据管理',
        icon: 'fa fa-sitemap',
        childs: [
        //   {
        //     name: 'staff',
        //     text: '人员管理',
        //     childs: [{
        //         name: 'add',
        //         text: '增加人员'
        //     },
        //      {
        //         name: 'edit',
        //         text: '编辑人员'
        //     }, {
        //         name: 'del',
        //         text: '删除人员'
        //     }]
        // },
          {
            name: 'team',
            text: '球队管理',
            childs: [{
                name: 'add',
                text: '增加球队'
            },
             {
                name: 'edit',
                text: '编辑球队'
            }, {
                name: 'del',
                text: '删除球队'
            }]
        },
         {
            name: 'player',
            text: '球员管理',
            childs: [{
                name: 'add',
                text: '增加球员'
            },
             {
                name: 'edit',
                text: '编辑球员'
            }, {
                name: 'del',
                text: '删除球员'
            }]
        },
        {
          name: 'category',
          text: '赛事管理',
          childs: [{
              name: 'add',
              text: '增加赛事'
          },
           {
              name: 'edit',
              text: '编辑赛事'
          }, {
              name: 'del',
              text: '删除赛事'
          }]
      },
         {
           name: 'matchday',
           text: '比赛管理',
           childs: [{
               name: 'add',
               text: '增加比赛'
           },
            {
               name: 'edit',
               text: '编辑比赛'
           }, {
               name: 'del',
               text: '删除比赛'
           }]
       },
       {
         name: 'game',
         text: '游戏管理',
         childs: [{
             name: 'add',
             text: '增加游戏'
         },
          {
             name: 'edit',
             text: '编辑游戏'
         }, {
             name: 'del',
             text: '删除游戏'
         }]
     },{
       name: 'dppg',
       text: 'DPPG管理',
       childs: [{
           name: 'add',
           text: '增加dppg'
       },
        {
           name: 'edit',
           text: '编辑dppg'
       }, {
           name: 'del',
           text: '删除dppg'
       }]
   }]
    }];
};
