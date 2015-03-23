##make dictionaries for all columns
import csv
import json
import collections
import operator
import sys
import datetime
csv.field_size_limit(sys.maxsize)

idDictionary = {}
multipleIdLocations = {}
def combineCarriers():
	with open('original.csv', 'rb') as csvfile:
		with open("original_combinedId.csv","wb") as outputfile:
			file = csv.reader(csvfile)
			csvfile.seek(1)
			next(csvfile, None)
			for line in file:
				phoneId = line[4]
				if phoneId == "":
					phoneId = line[5]
				outputfile.writerow([line[0],line[1],line[2],line[3],phoneId])
combineCarriers()
def outputCoordinatesToJson():
	with open('original.csv', 'rb') as csvfile:
		file = csv.reader(csvfile)
		csvfile.seek(1)
		next(csvfile, None)
		for line in file:
			phoneId = line[4]
			if phoneId == "":
				phoneId = line[5]
			idDictionary[phoneId] = idDictionary.get(phoneId,0)+1
	#print idDictionary
	sortedDictionary = sorted(idDictionary.items(), key=operator.itemgetter(1), reverse=True)
	#print sortedDictionary
	i = 0
	with open('original.csv', 'rb') as csvfile:
		print "2"
		file = csv.reader(csvfile)
		csvfile.seek(1)
		next(csvfile, None)
		for line in file:
			if i%10000 == 0:
				print i
			phoneId = line[4]
			if phoneId == "":
				phoneId = line[5]
			#print phoneId
			#print idDictionary[phoneId]
			if idDictionary[phoneId]>900 and idDictionary[phoneId]<1000 and phoneId != "" and phoneId != "null":
				i = i+1
			
				if phoneId in multipleIdLocations:
			##		if [line[0],line[1]] not in multipleIdLocations[phoneId]:
					multipleIdLocations[phoneId].append([line[0],line[1]])
				else:
					multipleIdLocations[phoneId] = []
					multipleIdLocations[phoneId].append([line[0],line[1]])
					#print multipleIdLocations		
					#break//# dc.js Getting Started and How-To Guide
	with open('test.txt', 'wb') as outfile:
	    json.dump(multipleIdLocations, outfile)

#outputCoordinatesToJson()
		
def filterOutByFrequencyToCsv():
	with open('original.csv', 'rb') as csvfile:
		file = csv.reader(csvfile)
		csvfile.seek(1)
		next(csvfile, None)
		for line in file:
			phoneId = line[3]
			if phoneId == "":
				phoneId = line[4]
			idDictionary[phoneId] = idDictionary.get(phoneId,0)+1
	#print idDictionary
	#sortedDictionary = sorted(idDictionary.items(), key=operator.itemgetter(1), reverse=True)
	#print sortedDictionary
	idsInRange = []
	for key in idDictionary:
		phoneId = key
		if idDictionary[phoneId]>10 and idDictionary[phoneId]<5000 and phoneId != "" and phoneId != "null":
			idsInRange.append(phoneId)
	print len(idsInRange)
		
##	with open('original.csv', 'rb') as csvfile:
##		file = csv.reader(csvfile)
##		csvfile.seek(1)
##		next(csvfile, None)
##		for line in file:
##			phoneId = line[3]
##			if phoneId == "":
##				phoneId = line[4]
#filterOutByFrequencyToCsv()