import os
import pandas as pd
import sys
import re

CWD_PATH = os.getcwd()



type_dic={'Balance_sheet':['consolidated balance sheets','consolidated balance sheet','balance Sheets','balance sheets'],
 'statement_of_income':['CONSOLIDATED STATEMENTS OF COMPREHENSIVE INCOME','consolidated income statements','consolidated statements of income','statements of income','consolidated statements of operations','statements of operations','consolidated statements of earnings','statements of earnings'], 'cash_flow_statement':['consolidated statements of cash flows','cash flows']}

company_lis=["llc","inc","inc.","corporation","ltd.","company"]

units_lis=['millions','thousands','(millions)','(thousands)']

months=['january','february','march','april','may','june','july','august','september','october','november','december']
dates=[]



#file_name=sys.argv[0]
#file_name='7.Public.RalphLauren.txt'


def parseet(file_name):
    title=[]
    company=""
    units=""
    currency="USD"
    typee=[]
    dates=[]

    out_n=0
    t=False
    company_var=True
    type_var=True
    units_var=True
    date_var=False




    file_name = os.path.join(CWD_PATH,file_name)

    with open(file_name, encoding="utf8") as infile:
        for line in infile:

            stripped=line.strip()
            stripped=stripped.lower()
            #fi=stripped.split(' ')
            if company_var:
                for i in company_lis:
                    if re.search('\\b'+i+'\\b', line, re.I):
                        print(i,line)
                        val=stripped.index(i)+len(i)
                        result=stripped[:val]
                        result=result.strip()
                        result=result.replace(',','')
                        # print(result)
                        company=result

                        company_var=False
            if units_var:
                for j in units_lis:
                    if re.search(j, line, re.I):
                        units=j
                        units_var=False


            t=False
            for k in type_dic:
                for m in type_dic[k]:
                    if re.search(m, line, re.I):
                        typee.append(k)
                        title.append(m)
                        del type_dic[k]
                        t=True
                        date_var=True
                        break
                if t:
                    break
            if date_var :
                month_found = [w for w in stripped.split() if w in months]
                if month_found != []:
                    date_var=True
                    dates.append(month_found)


                if date_var:
                    day=[int(s) for s in re.findall(r'\b\d+\b', stripped)]
                    day_month=[]
                    day_year=[]
                    for i in day:
                        if i > 31:
                            day_year.append(i)
                        else:
                            day_month.append(i)




                    #day=[int(s) for s in stripped.split() if s.isdigit()]
                    #day=[word for word in stripped.split() if word.isdigit() ]


                    if re.search('\$',stripped, re.I):
                        date_var=False

                    elif day:
                        if day_month:
                            dates.append(day_month)
                        if day_year:
                            dates.append(day_year)


    return title,company,units,currency,typee,dates
