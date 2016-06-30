express = require('express')
router = express.Router()
dataquery = require('../../services/web/dataquery')

router.get '/', (req, res) ->
  res.render 'arenaquery/resultquery/index',
    info: req.query.info
    error: req.query.error

router.post '/list.html', (req, res) ->
  msFromSql = "t_contest
         JOIN
         (SELECT contestId, count(id) as bonusNumber
          FROM t_entry WHERE t_entry.bonus > 0
          GROUP BY t_entry.contestId) as bonusCount
          ON t_contest.id = bonusCount.contestId"
  if req.body['MysSearch_0']
    msFromSql += "AND t_order.createdTime = #{req.body['MysSearch_0']} "
  if req.body['MysSearch_1']
    msFromSql += "AND t_product.name = #{req.body['MysSearch_1']} "

  tabledefinition =
    sTableName: 't_contest'
    sCountColumnName: 'id'
    sSelectSql: "t_contest.id,
                	t_contest.competitionId,
                  t_contest.matchDate,
                  t_contest.isOfficial,
                  t_contest.ruleId,
                  t_contest.entryPrice,
                  t_contest.entriesLimit,
                  bonusCount.bonusNumber,
                  t_contest.entriesCount"
    sFromSql: msFromSql
    aoColumnDefs: [
      { mData: 'competitionId', bSearchable: true }
      { mData: 'matchDate', bSearchable: false }
      { mData: 'isOfficial', bSearchable: false }
      { mData: 'ruleId', bSearchable: false }
      { mData: 'entryPrice', bSearchable: false }
      { mData: 'entriesLimit', bSearchable: false }
      { mData: 'entriesCount', bSearchable: false }
      { mData: 'bonusNumber', bSearchable: false }
      { mData: 'id', bSearchable: false }
      { mData: null, bSearchable: false }
    ]
  dataquery.pagedataDeer tabledefinition, req, res




router.post '/resultlist.html', (req, res) ->
  msFromSql = "t_entry
            LEFT JOIN
            t_users_address
            ON t_entry.userId = t_users_address.userId
            JOIN t_users
            ON t_entry.userId = t_users.id
            LEFT JOIN t_common_cities
            ON t_users_address.cityId = t_common_cities.id
            LEFT JOIN t_common_provinces
            ON t_users_address.provinceId = t_common_provinces.id
            LEFT JOIN t_users_profile
            ON t_entry.userId = t_users_profile.userId"
  if req.body['MysSearch_0']
    msFromSql += "AND t_order.createdTime = #{req.body['MysSearch_0']} "
  if req.body['MysSearch_1']
    msFromSql += "AND t_product.name = #{req.body['MysSearch_1']} "

  tabledefinition =
    sTableName: 't_entry'
    sCountColumnName: 'id'
    sSelectSql: "t_entry.rank,
                  t_entry.bonus,
                  t_entry.userId,
                  t_users.nickName,
                  t_users.mobile,
                  CONCAT(t_users_profile.province,'-', t_users_profile.city)
                   as currentLocation,
                  t_users_address.recipient,
                  t_users_address.phone,
                  CONCAT(t_common_cities.name,'-', t_common_provinces.name)
                   as name,
                  t_users_address.addressDetail,
                  t_entry.isLineupCompleted as processRecord"
    sFromSql: msFromSql
    aoColumnDefs: [
      { mData: 'competitionId', bSearchable: true }
      { mData: 'matchDate', bSearchable: false }
      { mData: 'isOfficial', bSearchable: false }
      { mData: 'ruleId', bSearchable: false }
      { mData: 'entryPrice', bSearchable: false }
      { mData: 'entriesLimit', bSearchable: false }
      { mData: 'entriesCount', bSearchable: false }
      { mData: 'bonusNumber', bSearchable: false }
      { mData: 'id', bSearchable: false }
      { mData: null, bSearchable: false }
    ]
  dataquery.pagedataDeer tabledefinition, req, res


router.get '/detail.html', (req, res) ->
  res.render 'arenaquery/resultquery/detail',
    info: req.query.info
    error: req.query.error




module.exports = router
