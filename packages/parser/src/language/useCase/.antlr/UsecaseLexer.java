// Generated from /home/omkar-kadam/Public/mermaid/mermaid/packages/parser/src/language/useCase/Usecase.g4 by ANTLR 4.13.1
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast", "CheckReturnValue", "this-escape"})
public class UsecaseLexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.13.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		USECASE_START=1, ACTOR=2, SYSTEM_BOUNDARY=3, END=4, ARROW=5, LABELED_ARROW=6, 
		AT=7, LBRACE=8, RBRACE=9, LPAREN=10, RPAREN=11, COMMA=12, COLON=13, STRING=14, 
		IDENTIFIER=15, NEWLINE=16, WS=17, COMMENT=18;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	private static String[] makeRuleNames() {
		return new String[] {
			"USECASE_START", "ACTOR", "SYSTEM_BOUNDARY", "END", "ARROW", "LABELED_ARROW", 
			"AT", "LBRACE", "RBRACE", "LPAREN", "RPAREN", "COMMA", "COLON", "STRING", 
			"IDENTIFIER", "NEWLINE", "WS", "COMMENT"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, "'usecase'", "'actor'", "'systemBoundary'", "'end'", null, null, 
			"'@'", "'{'", "'}'", "'('", "')'", "','", "':'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "USECASE_START", "ACTOR", "SYSTEM_BOUNDARY", "END", "ARROW", "LABELED_ARROW", 
			"AT", "LBRACE", "RBRACE", "LPAREN", "RPAREN", "COMMA", "COLON", "STRING", 
			"IDENTIFIER", "NEWLINE", "WS", "COMMENT"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}


	public UsecaseLexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "Usecase.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getChannelNames() { return channelNames; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\u0004\u0000\u0012\u009a\u0006\uffff\uffff\u0002\u0000\u0007\u0000\u0002"+
		"\u0001\u0007\u0001\u0002\u0002\u0007\u0002\u0002\u0003\u0007\u0003\u0002"+
		"\u0004\u0007\u0004\u0002\u0005\u0007\u0005\u0002\u0006\u0007\u0006\u0002"+
		"\u0007\u0007\u0007\u0002\b\u0007\b\u0002\t\u0007\t\u0002\n\u0007\n\u0002"+
		"\u000b\u0007\u000b\u0002\f\u0007\f\u0002\r\u0007\r\u0002\u000e\u0007\u000e"+
		"\u0002\u000f\u0007\u000f\u0002\u0010\u0007\u0010\u0002\u0011\u0007\u0011"+
		"\u0001\u0000\u0001\u0000\u0001\u0000\u0001\u0000\u0001\u0000\u0001\u0000"+
		"\u0001\u0000\u0001\u0000\u0001\u0001\u0001\u0001\u0001\u0001\u0001\u0001"+
		"\u0001\u0001\u0001\u0001\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002"+
		"\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0002\u0001\u0003"+
		"\u0001\u0003\u0001\u0003\u0001\u0003\u0001\u0004\u0001\u0004\u0001\u0004"+
		"\u0001\u0004\u0001\u0004\u0003\u0004L\b\u0004\u0001\u0005\u0001\u0005"+
		"\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005"+
		"\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005\u0001\u0005"+
		"\u0001\u0005\u0003\u0005]\b\u0005\u0001\u0006\u0001\u0006\u0001\u0007"+
		"\u0001\u0007\u0001\b\u0001\b\u0001\t\u0001\t\u0001\n\u0001\n\u0001\u000b"+
		"\u0001\u000b\u0001\f\u0001\f\u0001\r\u0001\r\u0005\ro\b\r\n\r\f\rr\t\r"+
		"\u0001\r\u0001\r\u0001\r\u0005\rw\b\r\n\r\f\rz\t\r\u0001\r\u0003\r}\b"+
		"\r\u0001\u000e\u0001\u000e\u0005\u000e\u0081\b\u000e\n\u000e\f\u000e\u0084"+
		"\t\u000e\u0001\u000f\u0004\u000f\u0087\b\u000f\u000b\u000f\f\u000f\u0088"+
		"\u0001\u0010\u0004\u0010\u008c\b\u0010\u000b\u0010\f\u0010\u008d\u0001"+
		"\u0010\u0001\u0010\u0001\u0011\u0001\u0011\u0005\u0011\u0094\b\u0011\n"+
		"\u0011\f\u0011\u0097\t\u0011\u0001\u0011\u0001\u0011\u0000\u0000\u0012"+
		"\u0001\u0001\u0003\u0002\u0005\u0003\u0007\u0004\t\u0005\u000b\u0006\r"+
		"\u0007\u000f\b\u0011\t\u0013\n\u0015\u000b\u0017\f\u0019\r\u001b\u000e"+
		"\u001d\u000f\u001f\u0010!\u0011#\u0012\u0001\u0000\u0006\u0003\u0000\n"+
		"\n\r\r\"\"\u0003\u0000\n\n\r\r\'\'\u0003\u0000AZ__az\u0004\u000009AZ_"+
		"_az\u0002\u0000\n\n\r\r\u0002\u0000\t\t  \u00a2\u0000\u0001\u0001\u0000"+
		"\u0000\u0000\u0000\u0003\u0001\u0000\u0000\u0000\u0000\u0005\u0001\u0000"+
		"\u0000\u0000\u0000\u0007\u0001\u0000\u0000\u0000\u0000\t\u0001\u0000\u0000"+
		"\u0000\u0000\u000b\u0001\u0000\u0000\u0000\u0000\r\u0001\u0000\u0000\u0000"+
		"\u0000\u000f\u0001\u0000\u0000\u0000\u0000\u0011\u0001\u0000\u0000\u0000"+
		"\u0000\u0013\u0001\u0000\u0000\u0000\u0000\u0015\u0001\u0000\u0000\u0000"+
		"\u0000\u0017\u0001\u0000\u0000\u0000\u0000\u0019\u0001\u0000\u0000\u0000"+
		"\u0000\u001b\u0001\u0000\u0000\u0000\u0000\u001d\u0001\u0000\u0000\u0000"+
		"\u0000\u001f\u0001\u0000\u0000\u0000\u0000!\u0001\u0000\u0000\u0000\u0000"+
		"#\u0001\u0000\u0000\u0000\u0001%\u0001\u0000\u0000\u0000\u0003-\u0001"+
		"\u0000\u0000\u0000\u00053\u0001\u0000\u0000\u0000\u0007B\u0001\u0000\u0000"+
		"\u0000\tK\u0001\u0000\u0000\u0000\u000b\\\u0001\u0000\u0000\u0000\r^\u0001"+
		"\u0000\u0000\u0000\u000f`\u0001\u0000\u0000\u0000\u0011b\u0001\u0000\u0000"+
		"\u0000\u0013d\u0001\u0000\u0000\u0000\u0015f\u0001\u0000\u0000\u0000\u0017"+
		"h\u0001\u0000\u0000\u0000\u0019j\u0001\u0000\u0000\u0000\u001b|\u0001"+
		"\u0000\u0000\u0000\u001d~\u0001\u0000\u0000\u0000\u001f\u0086\u0001\u0000"+
		"\u0000\u0000!\u008b\u0001\u0000\u0000\u0000#\u0091\u0001\u0000\u0000\u0000"+
		"%&\u0005u\u0000\u0000&\'\u0005s\u0000\u0000\'(\u0005e\u0000\u0000()\u0005"+
		"c\u0000\u0000)*\u0005a\u0000\u0000*+\u0005s\u0000\u0000+,\u0005e\u0000"+
		"\u0000,\u0002\u0001\u0000\u0000\u0000-.\u0005a\u0000\u0000./\u0005c\u0000"+
		"\u0000/0\u0005t\u0000\u000001\u0005o\u0000\u000012\u0005r\u0000\u0000"+
		"2\u0004\u0001\u0000\u0000\u000034\u0005s\u0000\u000045\u0005y\u0000\u0000"+
		"56\u0005s\u0000\u000067\u0005t\u0000\u000078\u0005e\u0000\u000089\u0005"+
		"m\u0000\u00009:\u0005B\u0000\u0000:;\u0005o\u0000\u0000;<\u0005u\u0000"+
		"\u0000<=\u0005n\u0000\u0000=>\u0005d\u0000\u0000>?\u0005a\u0000\u0000"+
		"?@\u0005r\u0000\u0000@A\u0005y\u0000\u0000A\u0006\u0001\u0000\u0000\u0000"+
		"BC\u0005e\u0000\u0000CD\u0005n\u0000\u0000DE\u0005d\u0000\u0000E\b\u0001"+
		"\u0000\u0000\u0000FG\u0005-\u0000\u0000GH\u0005-\u0000\u0000HL\u0005>"+
		"\u0000\u0000IJ\u0005-\u0000\u0000JL\u0005>\u0000\u0000KF\u0001\u0000\u0000"+
		"\u0000KI\u0001\u0000\u0000\u0000L\n\u0001\u0000\u0000\u0000MN\u0005-\u0000"+
		"\u0000NO\u0005-\u0000\u0000OP\u0001\u0000\u0000\u0000PQ\u0003\u001d\u000e"+
		"\u0000QR\u0005-\u0000\u0000RS\u0005-\u0000\u0000ST\u0005>\u0000\u0000"+
		"T]\u0001\u0000\u0000\u0000UV\u0005-\u0000\u0000VW\u0005-\u0000\u0000W"+
		"X\u0001\u0000\u0000\u0000XY\u0003\u001d\u000e\u0000YZ\u0005-\u0000\u0000"+
		"Z[\u0005>\u0000\u0000[]\u0001\u0000\u0000\u0000\\M\u0001\u0000\u0000\u0000"+
		"\\U\u0001\u0000\u0000\u0000]\f\u0001\u0000\u0000\u0000^_\u0005@\u0000"+
		"\u0000_\u000e\u0001\u0000\u0000\u0000`a\u0005{\u0000\u0000a\u0010\u0001"+
		"\u0000\u0000\u0000bc\u0005}\u0000\u0000c\u0012\u0001\u0000\u0000\u0000"+
		"de\u0005(\u0000\u0000e\u0014\u0001\u0000\u0000\u0000fg\u0005)\u0000\u0000"+
		"g\u0016\u0001\u0000\u0000\u0000hi\u0005,\u0000\u0000i\u0018\u0001\u0000"+
		"\u0000\u0000jk\u0005:\u0000\u0000k\u001a\u0001\u0000\u0000\u0000lp\u0005"+
		"\"\u0000\u0000mo\b\u0000\u0000\u0000nm\u0001\u0000\u0000\u0000or\u0001"+
		"\u0000\u0000\u0000pn\u0001\u0000\u0000\u0000pq\u0001\u0000\u0000\u0000"+
		"qs\u0001\u0000\u0000\u0000rp\u0001\u0000\u0000\u0000s}\u0005\"\u0000\u0000"+
		"tx\u0005\'\u0000\u0000uw\b\u0001\u0000\u0000vu\u0001\u0000\u0000\u0000"+
		"wz\u0001\u0000\u0000\u0000xv\u0001\u0000\u0000\u0000xy\u0001\u0000\u0000"+
		"\u0000y{\u0001\u0000\u0000\u0000zx\u0001\u0000\u0000\u0000{}\u0005\'\u0000"+
		"\u0000|l\u0001\u0000\u0000\u0000|t\u0001\u0000\u0000\u0000}\u001c\u0001"+
		"\u0000\u0000\u0000~\u0082\u0007\u0002\u0000\u0000\u007f\u0081\u0007\u0003"+
		"\u0000\u0000\u0080\u007f\u0001\u0000\u0000\u0000\u0081\u0084\u0001\u0000"+
		"\u0000\u0000\u0082\u0080\u0001\u0000\u0000\u0000\u0082\u0083\u0001\u0000"+
		"\u0000\u0000\u0083\u001e\u0001\u0000\u0000\u0000\u0084\u0082\u0001\u0000"+
		"\u0000\u0000\u0085\u0087\u0007\u0004\u0000\u0000\u0086\u0085\u0001\u0000"+
		"\u0000\u0000\u0087\u0088\u0001\u0000\u0000\u0000\u0088\u0086\u0001\u0000"+
		"\u0000\u0000\u0088\u0089\u0001\u0000\u0000\u0000\u0089 \u0001\u0000\u0000"+
		"\u0000\u008a\u008c\u0007\u0005\u0000\u0000\u008b\u008a\u0001\u0000\u0000"+
		"\u0000\u008c\u008d\u0001\u0000\u0000\u0000\u008d\u008b\u0001\u0000\u0000"+
		"\u0000\u008d\u008e\u0001\u0000\u0000\u0000\u008e\u008f\u0001\u0000\u0000"+
		"\u0000\u008f\u0090\u0006\u0010\u0000\u0000\u0090\"\u0001\u0000\u0000\u0000"+
		"\u0091\u0095\u0005%\u0000\u0000\u0092\u0094\b\u0004\u0000\u0000\u0093"+
		"\u0092\u0001\u0000\u0000\u0000\u0094\u0097\u0001\u0000\u0000\u0000\u0095"+
		"\u0093\u0001\u0000\u0000\u0000\u0095\u0096\u0001\u0000\u0000\u0000\u0096"+
		"\u0098\u0001\u0000\u0000\u0000\u0097\u0095\u0001\u0000\u0000\u0000\u0098"+
		"\u0099\u0006\u0011\u0000\u0000\u0099$\u0001\u0000\u0000\u0000\n\u0000"+
		"K\\px|\u0082\u0088\u008d\u0095\u0001\u0006\u0000\u0000";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}