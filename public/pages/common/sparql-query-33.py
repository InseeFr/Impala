"""
Pour Python 3.3
"""

import http.client as client
import urllib.parse as parse
import json

hostName = "rdf.insee.fr"
headers = {"Accept" : "application/json"}

queryString = """PREFIX idemo:<http://rdf.insee.fr/def/demo#>
PREFIX igeo:<http://rdf.insee.fr/def/geo#>
 
SELECT ?departement ?nom ?population WHERE {
    ?departement a igeo:Departement .
    ?departement igeo:nom ?nom .
    ?departement idemo:population ?popLeg .
    ?popLeg idemo:populationTotale ?population .
}
ORDER BY ?population
LIMIT 3
"""

params = {"query" : queryString}
encodedQuery = parse.urlencode(params)

connection = client.HTTPConnection(hostName)
connection.request("GET","/sparql?" + encodedQuery, "", headers)

resp = connection.getresponse()

if resp.status == client.OK :
        respAsString = bytes.decode(resp.read())
        jsonData = json.JSONDecoder().decode(respAsString)
        for binding in jsonData["results"]["bindings"] :
                dep = binding["nom"]["value"]
                pop = binding["population"]["value"]
                print("Nom : %s ; Population : %s" %(dep,pop))
else :
        print("Erreur : " + str(resp.status))
