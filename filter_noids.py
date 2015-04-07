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


def combineCarriers():
	noid = 0
	hasid =0
	with open('original_age.csv', 'rb') as csvfile:
		with open("hasid.csv","wb") as outputfile:
			file = csv.reader(csvfile)
			output =csv.writer(outputfile)
			for line in file:
				phoneId = line[4]
				if phoneId == "":
					phoneId = line[5]
				if phoneId == "":
					noid+=1
					#output.writerow(line)
				else:
					hasid +=1
					output.writerow(line)
	print noid, hasid

combineCarriers()