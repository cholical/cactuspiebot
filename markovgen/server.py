import argparse, sys, markovify
import zerorpc

# Default settings
port = 8000
host = "127.0.0.1"

# server class with relevant methods for markov chain generation
class MarkovGen(object):
	def hello(self, name):
		return "Hello, %s" % name

# start server
def main(host, port):
	s = zerorpc.Server(MarkovGen())
	s.bind("tcp://%s:%i" % (host, port))
	s.run()

if __name__=="__main__":
	parser = argparse.ArgumentParser(prog="MarkovGen", description='Command line arguments.', epilog='')
	parser.add_argument('-f', '--host', dest='host', action='store_true', help="specify ip address")
	parser.add_argument('-p', '--port', dest='port', action='store_true', help="specify port")
	args = parser.parse_args()

	if args.host:
		host = args.host
	if args.port:
		port = args.port
		
	main(host, port)



