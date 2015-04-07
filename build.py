##make dictionaries for all columns
import csv
import json
import collections
import operator
import sys
import datetime
csv.field_size_limit(sys.maxsize)
from datetime import datetime
from operator import itemgetter
from datetime import date
from math import radians, cos, sin, asin, sqrt

badCoordinates  = [[42.3548, -71.0546],[42.3559,-71.0646],[42.3549,-71.0646]]

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 3956 #6371 # Radius of earth in kilometers. Use 3956 for miles
    return c * r
#print datetime.today().weekday()

def weekDay(year, month, day):
    offset = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    week   = ['Sunday', 
              'Monday', 
              'Tuesday', 
              'Wednesday', 
              'Thursday',  
              'Friday', 
              'Saturday']
    afterFeb = 1
    if month > 2: afterFeb = 0
    aux = year - 1700 - afterFeb
    # dayOfWeek for 1700/1/1 = 5, Friday
    dayOfWeek  = 5
    # partial sum of days betweem current date and 1700/1/1
    dayOfWeek += (aux + afterFeb) * 365                  
    # leap year correction    
    dayOfWeek += aux / 4 - aux / 100 + (aux + 100) / 400     
    # sum monthly and day offsets
    dayOfWeek += offset[month - 1] + (day - 1)               
    dayOfWeek %= 7
    return dayOfWeek, week[dayOfWeek]

#print weekDay(2015,4,4)

	
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
def countMinutes(timestamp):
	time = timestamp.split(" ")[1]
	timearray = time.split(":")
	hours = int(timearray[0])
	minutes = int(timearray[1])
	totalminutes = hours*60+minutes
	return totalminutes
		
def outputCoordinatesToJson():
	with open('utile-5ad732/040115_DTX_people flow test_gender.csv', 'rb') as csvfile:
		file = csv.reader(csvfile)
		csvfile.seek(1)
		next(csvfile, None)
		for line in file:
			phoneId = line[0]
			if phoneId == "":
				phoneId = line[2]
			if phoneId!= "" and phoneId !="null":
				idDictionary[phoneId] = idDictionary.get(phoneId,0)+1
	#print idDictionary
	sortedDictionary = sorted(idDictionary.items(), key=operator.itemgetter(1), reverse=True)
	#print sortedDictionary
	i = 0
	ageArray = {}
	with open('utile-5ad732/040115_DTX_people flow test_gender.csv', 'rb') as csvfile:
		print "2"
		file = csv.reader(csvfile)
		csvfile.seek(1)
		next(csvfile, None)
		for line in file:
			if i%100000 == 0:
				print i
				
			phoneId = line[0]
			if phoneId == "":
				phoneId = line[2]
			
			gender = line[1]
			if gender == "" or gender == "O":
				gender = "N"
			ageArray[gender] = ageArray.get(gender,0)+1
			
			lat = line[3]
			lng = line[4]
			
			timestamp = line[5]
			minutes = countMinutes(timestamp)
			date = timestamp.split(" ")[0]
			dateArray = date.split("-")
			year = int(dateArray[0])
			month = int(dateArray[1])
			day = int(dateArray[2])

			weekday = weekDay(year,month,day)[0]
			
			if phoneId != "" and phoneId != "null":
				if lat !="" and lng!="" and timestamp !="":				
					i = i+1
					phoneIdDate = phoneId + " "+ date
					if phoneIdDate in multipleIdLocations:
						if [lat,lng,minutes,gender,weekday] not in multipleIdLocations[phoneIdDate]:
							multipleIdLocations[phoneIdDate].append([lat,lng,minutes,gender,weekday])
					else:
						multipleIdLocations[phoneIdDate] = []
						multipleIdLocations[phoneIdDate].append([lat,lng,minutes,gender,weekday])
						#print multipleIdLocations		
						#break//# dc.js Getting Started and How-To Guide

#sort within each id
	for item in multipleIdLocations:
		unsorted = multipleIdLocations[item]
	#	print unsorted
		output = sorted(unsorted,key=itemgetter(2))
		#print output
		multipleIdLocations[item] = output
	
	#write csv with line segments

#filter out not enough point ids, and convert to segments
	with open("segments.csv","wb") as outcsv:
		file = csv.writer(outcsv)
		for sortedItem in multipleIdLocations:
			pointsPerDayPerId = len(multipleIdLocations[sortedItem])
		
			if pointsPerDayPerId > 2:
				#print pointsPerDayPerId, multipleIdLocations[sortedItem]
			
				for j in range(pointsPerDayPerId-1):

					weekday = multipleIdLocations[sortedItem][j][4]
					gender = multipleIdLocations[sortedItem][j][3]
					startminutes = multipleIdLocations[sortedItem][j][2]
					endminutes = multipleIdLocations[sortedItem][j+1][2]
					
					startlat = float(multipleIdLocations[sortedItem][j][0])
					startlng = float(multipleIdLocations[sortedItem][j][1])
					endlat = float(multipleIdLocations[sortedItem][j+1][0])
					endlng = float(multipleIdLocations[sortedItem][j+1][1])
					
					duration = endminutes-startminutes
					
					if ([startlat,startlng] in badCoordinates and [endlat,endlng] in badCoordinates)==False:
						if startlat != endlat and startlng != endlng and duration > 0:
							distance = haversine(startlng, startlat, endlng, endlat)
							speed = distance/duration*60
							if speed < .5:
##							#print startlat, startlng, endlat, endlng,weekday,gender,startminutes,endminutes,sortedItem
								#print speed, distance

								file.writerow([startlat, startlng, endlat, endlng,weekday,gender,startminutes,duration,sortedItem])
						

	with open('test.txt', 'wb') as outfile:
	    json.dump(multipleIdLocations, outfile)
	print ageArray

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