deerdata = require("./index")
console.log deerdata
do () ->
  t = () ->
    deerdata.getMatchDateByCompetitionId(1)
    .then (res) ->
      console.log res
  setTimeout t, 1000
