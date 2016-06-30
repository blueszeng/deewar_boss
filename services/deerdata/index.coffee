deerdata = require('./deerDataAuth')

getAllCompetition = () ->
  new Promise (resolve, reject) ->
    refUrl = "http://192.168.1.238:5510/deerWars/
      findAllMatchesByCompetitionIdAndMatchDate"
    deerdata.excuteGetDataFromDeerData(refUrl)
    .then (res) ->
      competitionList = res
      competitions = []
      for competition in competitionList
        competitions.push
          id: competition.competitionId,
          name: competition.competitionName
      resolve(competitions)
    .catch (err) ->
      reject(err)

getMatchDateByCompetitionId = (competitionId) ->
  new Promise (resolve, reject) ->
    refUrl = "http://192.168.1.238:5510/deerWars/
      findAllMatchesByCompetitionIdAndMatchDate"
    deerdata.excuteGetDataFromDeerData(refUrl)
    .then (res) ->
      competitionList = res
      competitions = []
      for competition in competitionList
        if competition.competitionId is competitionId
          competitions.push
            matchDate: competition.matchDate
      resolve(competitions)
    .catch (err) ->
      reject(err)

module.exports =
  getMatchDateByCompetitionId: getMatchDateByCompetitionId
  getAllCompetition: getAllCompetition
