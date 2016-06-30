express = require('express')
Joi = require('joi')
router = express.Router()
dataquery = require('../../services/web/dataquery')
arena = require('../../model/officialarena/arena')
deerdata = require('../../services/deerdata/index')

router.get '/', (req, res) ->
  res.render 'officialarena/arena/index',
    info: req.query.info
    error: req.query.error

router.post '/list.html', (req, res) ->
  tabledefinition =
    sTableName: 't_contest'
    sCountColumnName: 'id'
    sWhereAndSql: 'isOfficial = 1'
    aoColumnDefs: [
      { mData: 'competitionId', bSearchable: true }
      { mData: 'name', bSearchable: false }
      { mData: 'matchDate', bSearchable: false }
      { mData: 'visibleTime', bSearchable: false }
      { mData: 'ruleId', bSearchable: false }
      { mData: 'extraInfo', bSearchable: false }
      { mData: 'maxBonus', bSearchable: false }
      { mData: 'entryPrice', bSearchable: false }
      { mData: 'entriesLimit', bSearchable: false }
      { mData: 'priority', bSearchable: false }
      { mData: 'isVisible', bSearchable: false }
      { mData: 'id', bSearchable: false }
      { mData: null, bSearchable: false }
    ]
  dataquery.pagedataDeer tabledefinition, req, res

router.get '/add.html', (req, res) ->
  res.render 'officialarena/arena/add',
    info: req.query.info
    error: req.query.error

router.post '/add', (req, res) ->
  #  ajax post 请求
  contest = req.body
  contest.ruleId = Number(contest.ruleId)
  contest.maxBonus = Number(contest.maxBonus)
  contest.entryPrice = Number(contest.entryPrice)
  contest.entriesLimit = Number(contest.entriesLimit)
  contest.priority = Number(contest.priority)
  contest.isVisible = Number(contest.isVisible)
  console.log contest
  schema = Joi.object().keys
    competitionId: Joi.number().integer().required()
    name: Joi.string().min(1).required()
    matchDate: Joi.date().required()
    visibleTime: Joi.date().required()
    ruleId: Joi.number().integer().required()
    extraInfo: Joi.string()
    maxBonus: Joi.number().integer().required()
    entryPrice: Joi.number().integer().required()
    entriesLimit: Joi.number().integer().required()
    priority: Joi.number().integer().required()
    isVisible: Joi.number().integer().required()
  Joi.validate  contest , schema, (err, value) ->
    return res.json status: false, message: "#{encodeURI('无法创建官方竞技场')}" if err
    contest.name  = "【官方最佳奖励】 " + contest.name
    arena.createOfficialarena(contest)
    .then (ret) ->
      return res.json status: true, data: ret
    .catch (err) ->
      console.log err
      return res.json status: false, message: "#{encodeURI('无法创建官方竞技场')}"

router.get '/allCompetition', (req, res) ->
  deerdata.getAllCompetition()
  .then (ret) ->
    return res.json status: true, data: ret
  .catch (err) ->
    console.log err
    return res.json status: false, message: "#{encodeURI('获取所有比赛失败')}"

router.get '/allMatchDate', (req, res) ->
  competitionId = parseInt(req.query.id)
  schema = Joi.number().integer().label('competitionId不合法')
  Joi.validate  competitionId , schema, (err, value) ->
    return res.json status: false, message: err.details[0].context.key　 if err
    deerdata.getMatchDateByCompetitionId(competitionId)
    .then (ret) ->
      console.log ret
      return res.json status: true, data: ret
    .catch (err) ->
      return res.json status: false, message: "#{encodeURI('获取所有matchDate失败')}"


router.get '/edit.html', (req, res) ->
  editInfo =
    contestId: parseInt(req.query.id)
    competitionId: parseInt(req.query.competitionId)
  console.log editInfo
  schema = Joi.object().keys
    contestId: Joi.number().integer().required()
    competitionId: Joi.number().integer().required()
  Joi.validate  editInfo , schema, (err, value) ->
    if err
      return res.redirect "/officialarena/arena/?error=#{encodeURI('无法编辑竞技场')}"
    Promise.all([
     arena.getOfficialarenaContest editInfo.contestId
     deerdata.getAllCompetition()
     deerdata.getMatchDateByCompetitionId editInfo.competitionId
    ]
    ).then (ret) ->
      console.log ret
      res.render 'officialarena/arena/edit',
          contest: ret[0]
          competition: ret[1]
          matchDate: ret[2]
    .catch (err) ->
      res.redirect "/officialarena/arena/?error=#{encodeURI('无法编辑竞技场')}"

router.post '/edit.html', (req, res) ->
  contest = req.body
  delete contest.time
  delete contest.minutes
  delete contest.seconds
  delete contest.addReward
  schema = Joi.object().keys
    contestId: Joi.number().integer().required()
    competition: Joi.number().integer().required()
    name: Joi.string().min(1).required()
    matchDate: Joi.date().min('now').required()
    visibleTime: Joi.date().required()
    rule: Joi.number().integer().required()
    extraInfo: Joi.string()
    maxBonus: Joi.number().integer().required()
    entryPrice: Joi.number().integer().required()
    entriesLimit: Joi.number().integer().required()
    priority: Joi.number().integer().required()
    isVisible: Joi.number().integer().required()
  Joi.validate  contest , schema, (err, value) ->
    console.log 'err', err
    if err
      return res.redirect "/officialarena/arena/?error
        =#{encodeURI('无法编辑官方竞技场')}"
    arena.updateOfficialarena(contest)
    .then (ret) ->
      res.redirect "/officialarena/arena/?info=#{encodeURI('编辑官方竞技场成功')}"
    .catch (err) ->
      console.log err
      res.redirect "/officialarena/arena/?error=#{encodeURI('无法编辑官方竞技场')}"

router.get '/del.html', (req, res) ->
  contestId = parseInt(req.query.id)
  schema = Joi.number().integer()
  Joi.validate  contestId , schema, (err, value) ->
    res.redirect "/officialarena/arena/?error=#{encodeURI('删除官方竞技场失败')}" if err
    arena.delOfficialarenaByContestId(contestId)
    .then () ->
      res.redirect "/officialarena/arena/?info=#{encodeURI('删官方竞技场成功')}"
    .catch (err) ->
      res.redirect "/officialarena/arena/?error=#{encodeURI('删除官方竞技场失败')}"

module.exports = router
