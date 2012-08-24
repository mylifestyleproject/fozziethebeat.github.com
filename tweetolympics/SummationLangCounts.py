import json

sportCount = []
for sport in ['all', 'archery', 'tennis', 'gymnastics', 'judo', 'fencing']:
    f = "olympics.%s.langs.json"%sport
    sum = 0
    for countItem in json.loads(open(f).read()):
        sum += countItem['count']
    sportCount.append( { "key": sport, "value": int(sum) } )
print json.dumps(sportCount)
