import markovify
import re
import spacy

nlp = spacy.load("en", parser=False)

class POSifiedText(markovify.NewlineText):
    '''
    A custom markovify.Text class that uses spacy POS tagging to make
    more accurate sentences.
    '''
    def word_split(self, sentence):
        return ["::".join((word.orth_, word.pos_)) for word in nlp(sentence)]
    def word_join(self, words):
        sentence = " ".join(word.split("::")[0] for word in words)
        return sentence
