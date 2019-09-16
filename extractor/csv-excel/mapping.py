dicti={'Cash Equivalents':['Cash','Cash Equivalents','Cash & Equivalents','Cash and cash equivalents', 'Cash and equivalents','Cash & Cash Equivalents','Money Market','Money Market Securities','Marketable securities'],
'Shareholders Equity': ['Shareholders’ Equity','Stockholders’ Equity','Owners’ Equity','Equity'],
'Net Income/Loss':['Net loss (Income)','Net loss/Income','Net Income (loss)','Net Income/loss','Net Income','Net loss'],
'Retained Earnings':['Retained earnings','Accumulated Deficit','Retained earnings (Accumulated Deficit)','Accumulated Deficit (Retained earnings)'],
'Accounts Receivable':['Receivables','Accounts receivable','Accounts receivable,net','AR'],
'Inventories':['Inventories','Inventories - Total','Inventory'],
'Other current assets':['Prepaid Expenditures','Prepayments','Prepayables','Prepaid Expenses','Prepaid Expenses and other current assets','Current Assets-Other','Other Current Assets','Other Short Term Current Assets','Other Short-Term Current Assets'],
'Total Current Assets':['Current Assets-Total','Total Current Assets'],
'PPE':['Plant,Property & Equip(Gross)','Plant,Property & Equipment','Plant,Property and Equipment','PPE'],
'PPE(Net)':['Property,plant and equipment,net','Plant,Property & Equipment,net','Property,plant and equipment,less accumulated depreciation','Property and equipment,net','Plant and equipment,net','Plant,Property & Equip(net)','Plant,property & Equipment(Net)','Plant,property and Equipment(Net)','PPE(Net)'],
'Intangible Assets':['Identifiable intangible assets, net','Other intangible assets','Intangible assets, net','Identifiable intangible assets, less accumulated amortization','Other intangible assets, net'],
'Net Revenue':['Net Sales','Net Revenue','Net Revenues','Revenue','Revenues','Net Sale'],
'Cost of Revenue':['Cost of Sales','Cost of Revenues','Cost of Sale','Cost of Revenue'],
'Cost of goods sold':['COGs','Cost of goods sold'],
'Gross Profit':['Gross Margin','Gross Profit'],
'Operating Income/loss':['Operating income','Operating loss','Operating income (loss)','Operating Profit','Income from operations','Operating Income/Loss','Loss from operations','Profit from operations','Operating income or loss'],
'Total Operating Expenses':['Total operating expenses','Operating expenses'],
'Research and Development':['Research and development','R & D'],
'Earnings before Income Taxes':['Loss before income taxes','Income before provision for income taxes','Earnings before income taxes','income (loss) before income taxes'],
'Provision for income taxes':['Income tax expense','Income tax expense (benefit)','provison/(benefit) for taxes on income','Income tax benefit (provision)','Provision for income taxes'],
'Net change in cash':['Net increase (decrease) in cash and cash equivalents','Net increase (decrease) in cash, cash equivalents, and restricted cash','net decrease (increase) in cash and cash equivalents','Increase/(Decrease) in cash and cash equivalents','Net increase/(Decrease) in cash and cash equivalents','Net increase (decrease) in cash and equivalents','Cash and cash equivalents: Increase','Net decrease in cash and cash equivalents','Net increase in cash and cash equivalents'],
'Cash Beginning':['Cash and cash equivalents at beginning of period','Cash, cash equivalents, and restricted cash at beginning of period','Cash and cash equivalents-beginning of year','Cash and cash equivalents , beginning of period','Cash and equivalents, beginning of year','Cash and cash equivalents: Balance at beginning of year','Cash and cash equivalents, beginning','Cash and cash equivalents at beginning of year'],
'Cash Ending':['Cash and cash equivalents at end of period','Cash, cash equivalents, and restricted cash at end of period','Cash and cash equivalents, end','Cash and cash equivalents , end of period','Cash and equivalents, end of year','Cash and cash equivalents-end of year','Cash and cash equivalents: Balance at end of year','Cash and cash equivalents at end of year','Cash and cash equivalents , end of the year'],
'Depreciation and Amortization':['Depreciation, Depletion, & Amortiz'],
'Income Tax':['Income Taxes - Total']}





code_dict={'Net Revenue':'AM_IS_I',
'Cost of goods sold':'AM_IS_COGS',
'Gross Profit':'AM_IS_GP',
'Operating Income/loss':'AM_IS_NOI',
'Total Operating Expenses':'AM_IS_E',
'Net Income/Loss':'AM_IS_NI',
'Cash Equivalents':'AM_BS_BA',
'Shareholders Equity':'AM_BS_E',
'Net Income/Loss':'AM_BS_NI',
'Accounts Receivable':'AM_BS_AR',
'Other current assets':'AM_BS_OCA',
'Total Current Assets':'AM_BS_CA',
'Net change in cash':'AM_CF_CI',
'Cash Beginning':'AM_CF_BC',
'Cash Ending':'AM_CF_EC'
}





#########################################################################




from spellchecker import SpellChecker
import re
import sys
import json



import nltk
import pandas as pd
import os
import csv




cwd_path = os.getcwd()
CWD_PATH = os.getcwd()

#file = sys.argv[1]
#file_name1=sys.argv[2]

#filee='csv_build/15.Public.Tj_Maxx.xlsx'
# filee='csv_build/16.Public.Walmart.csv'
filee = sys.argv[1]

list_folder=[sys.argv[3]+'/text',sys.argv[3]+'/textfiles']
for i in list_folder:
	for th in os.listdir(os.path.join(cwd_path,i)):
		file_path_del = os.path.join(cwd_path,i, th)
		try:
			if os.path.isfile(file_path_del):
				os.unlink(file_path_del)
		except Exception as e:
			print(e)

####################################

if len(sys.argv) == 5:
	pd.read_excel(filee, header=None).to_csv(sys.argv[4], index=False,header=None)

####################################################################################################


company=""
dates=[]
gross=[]
total_expense=[]
inc_tax=[]
inc_expense=[]
ebitda=[]
ebit=[]
ebt=[]
net_inc_loss=[]
dp=[]
k1=0

if len(sys.argv) == 5:
	csv_file = sys.argv[4]
else:
	csv_file = filee
txt_file = sys.argv[3]+"/text/csv_text.txt"

with open(txt_file, "w", encoding='iso-8859-1') as my_output_file:
	with open(csv_file, "r", encoding='iso-8859-1') as my_input_file:
		[my_output_file.write(" ".join(row)+'\n') for row in csv.reader(my_input_file)]
	my_output_file.close()

with open(txt_file, "r", encoding='iso-8859-1') as f:
	content = f.readlines()

Balance_Sheet =[x for x in range(len(content)) if 'STATEMENT OF FINANCIAL POSITION' in content[x].strip()]
Inc_st = [x for x in range(len(content)) if 'INCOME STATEMENT' in content[x].strip()]
cf_st = [x for x in range(len(content)) if 'STATEMENT OF CASH FLOWS' in content[x].strip()]

flag1=False
flag2=False
flag3=False
f1= open(sys.argv[3]+"/textfiles/Balance_sheet.txt","w")
f2= open(sys.argv[3]+"/textfiles/statement_of_income.txt","w")
f3= open(sys.argv[3]+"/textfiles/cash_flow_statement.txt","w")
for x, line in enumerate(content):

	if x ==0:
		company=line.split(':')[1]

	if re.search('FYR Ending',line,re.I):
		d=line.split(':')[1]
		d=d.replace('(',' ').replace(')',' ')
		l=d.split()
		new_lis=[]
		for i in l:
			if i != 'N/A' and i:
				new_lis.append(i)
		dates.append(new_lis)




	if x==Balance_Sheet[0]:
		flag1=True
		flag2=False
		flag3=False
	if x==Inc_st[0]:
		flag2=True
		flag1=False
		flag3=False
	if x==cf_st[0]:
		flag3=True
		flag1=False
		flag2=False
	if flag1==True:
		f1.write(line)
	if flag2==True:
		f2.write(line)
	if flag3==True:
		f3.write(line)

f1.close()
f2.close()
f3.close()


##################################################################

def fo(li):
	line=li.replace("$","").replace(",","").replace("(","-").replace(")","")
	return line

#####################################################################################

###########################################################################################################

def sub_items(filepath):
		indentation = []
		indentation.append(0)
		depth = 0
		depth_lis=[]
		content_lis=[]
		depth_lis1=[]
		content_lis1=[]

		with open(filepath,'r') as infile:
			for num1,line in enumerate(infile):
				if num1>2:

					line = line[:-1]
					st_text=" ".join(re.split("[^a-zA-Z]*", line))
					line1=line.replace(',','')
					st_digit=re.findall("[-]*\d+\.\d+|[-]*\d+",line1)


					st_digit.insert(0,st_text)

					c=st_digit

					if c:
						content_lis.append(c)

					content = line.strip()
					indent = len(line) - len(content)



					if indent > indentation[-1]:
						depth += 1
						indentation.append(indent)

					elif indent < indentation[-1]:
						while indent < indentation[-1]:
							depth -= 1
							indentation.pop()
						if indent != indentation[-1]:
							pass
							#raise RuntimeError("Bad formatting")
					depth_lis.append(depth)

		for con_i,dep_j in zip(content_lis,depth_lis):
			if con_i != [" "]:
				content_lis1.append(con_i)
				depth_lis1.append(dep_j)




		return depth_lis1, content_lis1




####################################################################################

main_json={}
out_m=0






start_line=0


note_lis=[]
unit_convers=False
type_var= False
months_var=False

#################################################################    1   ################################################
folder=sys.argv[3]+'/textfiles'
for th in os.listdir(os.path.join(cwd_path,folder)):
	title=th.split('.')[0]

	file_path1= os.path.join(cwd_path,folder,th)
	dataframe_list=[]
	with open(file_path1) as infile:
		for num,line in enumerate(infile):
			if num >2:

				st=" ".join(re.split("[^a-zA-Z]*", line))
				if st:
						dataframe_list.append(st)
	spell = SpellChecker()
	newlist=[]
	codelist=[]
	suggestion_flag=[]
	for text in dataframe_list:


		flag=0

		text=re.sub('[^a-zA-Z0-9\n\.]', ' ',str(text))
		text=re.sub("[\(\[].*?[\)\]]", "", text)
		text=re.sub(' +'," ",text)
		if re.search('accounts receivable',text,re.I):
			text= "Accounts Receivable"
		text_vocab = list(w.lower() for w in text.split() if w.isalpha())

		translated=""
		code=""
		flag=0
		temp=[]
		for word in text_vocab:

			temp.append(word)
			misspelled = spell.unknown(temp)
			temp=[]
			if misspelled:
				flag=1
				translated=translated+" "+word
			else:
				translated=translated+" "+word
		translated=translated.strip()


		for key,value in dicti.items():
			for item in value:

				item=re.sub('[^a-zA-Z0-9\n\.]', ' ',item)
				item=re.sub("[\(\[].*?[\)\]]", "", item)
				item=re.sub(' +'," ",item)
				if translated==item.lower():
					translated=key
					code=code_dict.get(translated,"None")

		translated=translated.capitalize()
		codelist.append(code)
		newlist.append(translated)
		suggestion_flag.append(flag)
	#tdf=pd.DataFrame()

	#tdf['Original']=[x for x in dataframe_list if x]
	#tdf['Transformed']=[x1 for x1 in newlist if x1]
	#tdf['Code']=[x2 for x2 in codelist if x2]
	#tdf['suggestion']=[x for x3 in suggestion_flag if x3]
	#tdf

###########################################################################  2 #######################################################
	original1=[]
	transformed=[]
	code=[]
	col=[]
	for i,j,k in zip(dataframe_list,newlist,codelist):

		if i != " " :
			original1.append(i)
			col.append(i)
			code.append(k)

		if j != "":
			transformed.append(j)


#########################################################################         3         #######################################

	n=0
	
		
	indentation = []
	indentation.append(0)
	depth = 0
	lis=[]
	main_json['title']=title
	main_json['type']=title
	main_json["company"]=company
	inc_flag=False
	cf_flag=False

	if main_json["title"] == "Balance_sheet":
		type_var=True
	if main_json["title"] == "Balance_sheet":
		
		inc_flag=False
		cf_flag=False
	if main_json["title"]=="statement_of_income":
		inc_flag=True
		cf_flag=False
	   
	if main_json["title"]=="cash_flow_statement":
		inc_flag=False
		cf_flag=True
	main_json['period']=[{} for i in range(len(dates[out_m]))]
	k=0
	for j,da in zip(main_json['period'],dates[out_m]):

		j["asof"]=da
		j['statement']=[]
		depth_lis_r,content_lis_r=sub_items(file_path1)

		conversio=False
		line_span1=False
		sum_inc=0
		sum_dp=0
		for f, b, ori, tr, co in zip(depth_lis_r, content_lis_r, original1, transformed, code):
			if inc_flag==True and len(b) != 1:
				if re.search('gross profit',tr,re.I) or re.search('Operating Income/loss',tr,re.I):
					gross.insert(k,b[k+1])
				if re.search('Income Tax',tr,re.I):
					inc_tax.insert(k,b[k+1])
				if re.search('Interest Expense',b[0],re.I):
					inc_expense.insert(k,b[k+1])
				if re.search('Net Income (Loss)',b[0],re.I):
					net_inc_loss.insert(k,b[k+1])
				if re.search('Depreciation and Amortization',tr,re.I):
					dp.insert(k,b[k+1])
			if re.search('Total',b[0],re.I) and len(b)>1 and type_var:
				if k+1 < len(b) :
					b[k+1]=re.sub('[^A-Za-z0-9.-]+', '', b[k+1])
					try:

						b[k+1]=float(b[k+1])
					except:
						pass


					total_c={"desc":b[0],'transformed':tr,'code':co,'value':b[k+1]}
					v=j['statement'][-1]
					if 'total' in v:
						v['total1']=total_c
					else:

						v['total']=total_c
			else:

				if len(b) == 1:

					head_d={'heading':b[0],'transformed':tr,'code':co,'items':[]}
					if head_d['heading'] or head_d['items']:
						j['statement'].append(head_d)
				elif f !=0 :
					if k+1 < len(b) :
						b[k+1]=re.sub('[^A-Za-z0-9.-]+', '', b[k+1])
						try:

							b[k+1]=float(b[k+1])
						except:
							pass

						decs_c={"desc":b[0],'transformed':tr,'code':co,'value':b[k+1]}
						if not j['statement']:
							j['statement'].append(decs_c)
						else:
							desc_v=j['statement'][-1]
							if 'items' in desc_v:
								desc_v['items'].append(decs_c)
							else:
								j['statement'].append(decs_c)

				else:
					if k+1 < len(b) :
						b[k+1]=re.sub('[^A-Za-z0-9.-]+', '', b[k+1])
						try:

							b[k+1]=float(b[k+1])
						except:
							pass


						desc_l={"desc":b[0],'transformed':tr,'code':co,'value':b[k+1]}
						j['statement'].append(desc_l)
		k+=1


	with open(sys.argv[2]+"{}.json".format(out_m), "w") as outfile:
		json.dump(main_json,outfile,indent=4)





	out_m+=1
	main_json={}

	#######################################################################################
#########################################################
#######################################################################################
#print(inc_tax,inc_expense,net_inc_loss,dp,gross)
if not net_inc_loss:
	net_inc_loss=[0]*(k1+1)
if not dp:
	dp=[0]*(k1+1)
if not inc_expense:
	inc_expense=[0]*(k1+1)
if not inc_tax:
	inc_tax=[0]*(k1+1)
for m,n,p,i,g in zip(dp,inc_expense,inc_tax,net_inc_loss,gross):
 
		val=float(i)+float(p)
		ebt.append(val)
		val2=val+float(n)
		ebit.append(val2)

		val3=val2+float(m)
		ebitda.append(val3)

		val4=float(g)-val3
		total_expense.append(val4)



#if ebitda and ebit and ebt:
#folder=sys.argv[2].replace('/file', '')
#folder=folder.replace('./', '')
# if ebitda and ebit and ebt:
#print(ebitda)

folder=sys.argv[2].replace('/file', '')
folder=folder.replace('./', '')
for th in os.listdir(os.path.join(cwd_path, folder)):
	file_path = os.path.join(cwd_path, folder, th)
	with open(file_path,"r+") as json_data:
		d=json.load(json_data)
		if d['title'] == "statement_of_income":
			for i,j,k,a,b,c,d1,m,t in zip(ebitda,ebit,ebt,net_inc_loss,dp,inc_expense,inc_tax,d['period'],total_expense):
				m['Additional']=[{"desc":"Non-Cash Expenses & Non-Recurring One-Time Charges","code":"AM_I_EXP ","value":t},{"desc":"EBITDA","code":"EB1","value":i,"items":[{"desc":"EBIT","code":"EB2","value":j},{"desc":"Depreciation & Amortization","code":"DA","value":b}]},{"desc":"EBIT","code":"EB2","value":j,"items":[{"desc":"EBT","code":"EB3","value":k},{"desc":"Interest Expense/Income","code":"IE","value":c}]},{"desc":"EBT","code":"EB3","value":k,"items":[{"desc":"Net Income/Loss","code":"AM_IS_NI","value":float(a)},{"desc":"Income Tax","code":"IT","value":float(d1)}]}]

		json_data.seek(0)  # rewind
		json.dump(d,json_data,indent=4)
		json_data.truncate()

