import argparse, sys, markovify, POSifiedText, os
import zerorpc

# Default settings
port = 8000
host = "127.0.0.1"
modelDirectory = "models" # specify a path relative to this script's location
scriptDir = os.path.dirname(__file__) #<-- absolute dir the script is in

# server class with relevant methods for markov chain generation
class MarkovGen(object):
	def __init__(self, directory = "models"):
		self.modelList = []
		self.directory = directory

		dirPath = os.path.join(scriptDir,self.directory)
		if not os.path.exists(dirPath):
    		os.makedirs(dirPath)
    	else:
    		# generate list of currently available models
    		for fname in os.listdir(dirPath):
    			if fname[-5:] == ".json":
    				self.modelList.append(fname[:-5])

    def hello(self, name):
        return "Hello, %s" % name

    def getModelPath(self, modelUID):
    	''' Returns the absolute file path for a given model unique id'''
    	return os.path.join(scriptDir, self.directory + "/" + str(modelUID) + ".json")

    def writeModel(self, modelUID, model):
    	''' writes a model to a file specified with modelUID '''
    	if modelUID not in self.modelList:
    		self.modelList.append(modelUID)
    	modelJSON = model.to_json()
        with open(self.getModelPath(modelUID),"w") as outfile:
        	outfile.write(modelJSON)

    def loadModel(self, modelUID):
    	''' loads a model from file and returns it given a modelUID '''
    	if modelUID not in self.modelList:
    		return "Model doesn't exist."
    	with open(self.getModelPath(modelUID), "r") as infile:
    		modelJSON = infile.read()
    	return POSifiedText.from_json(modelJSON)

    def createModel(self, filename, modelUID):
    	''' 
    	Create a markov model using the specified filename as the corpora. 
    	Sentences must be deliniated with newline. If there is an existing model
    	with the same modelUID, the corpora from filename will be combined with 
    	the existing model (so don't pass in files as corpora that have overlapping content)
    	'''
    	with open(filename) as f:
    		text = f.read()

    	model = POSifiedText(text)

    	#add this model to the existing one if the model unique id already exists
    	if modelUID in self.modelList:
    		oldmodel = self.loadModel(modelUID)
    		model =	markovify.combine(models=[oldmodel, model])

        #write the model to file (this will replace any existing model)
        self.writeModel(modelUID, model)
        
    def readModel(self, modelUID, num_sents = 1, char_range = (), tries = 10, max_words = None, test_output = True):
    	''' 
    	Loads a given model from it's unique id, provided it exists 

		Parms: 
		- num_sents: how many sentences to create 
		- char_range: optional tuple specifying the min and max character length 
		- tries: how many times to try and make a sentence that doesnt overlap much with the corpora until just returning none
		- max_words: max words of sentence
		- test_output: boolean to toggle preventing overlap or not
    	'''
    	model = self.loadModel(modelUID)
    	sents = []

    	# determine which funciton to use
    	if len(char_range) == 2 and char_range[1] >= char_range[0]:
	    	for i in range(num_sents):
				sentence = model.make_short_sentence(max_chars = char_range[1], min_chars = char_range[0], tries = tries, max_words = max_words, test_output = test_output)
				sents.append(sentence)
		else:
			for i in range(num_sents):
				sentence = model.make_sentence(tries = tries, max_words = max_words, test_output = test_output)
				sents.append(sentence)

		return sents

# start server
def main(host, port):
    s = zerorpc.Server(MarkovGen())
    s.bind("tcp://%s:%i" % (host, port))
    s.run()
    print("MarkovGen server started at %s:%i." % (host, port))

if __name__=="__main__":
    parser = argparse.ArgumentParser(prog="MarkovGen", description='Command line arguments.', epilog='')
    parser.add_argument('-H', '--host', dest='host', action='store_true', help="specify ip address")
    parser.add_argument('-p', '--port', dest='port', action='store_true', help="specify port")
    args = parser.parse_args()

    if args.host:
        host = args.host
    if args.port:
        port = args.port
        
    main(host, port)



