// Generated from /Users/pengxiao/workspaces/zenuml/zenuml-core/src/g4/sequenceParser.g4 by ANTLR 4.10.1
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link sequenceParser}.
 */
public interface sequenceParserListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link sequenceParser#prog}.
	 * @param ctx the parse tree
	 */
	void enterProg(sequenceParser.ProgContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#prog}.
	 * @param ctx the parse tree
	 */
	void exitProg(sequenceParser.ProgContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#title}.
	 * @param ctx the parse tree
	 */
	void enterTitle(sequenceParser.TitleContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#title}.
	 * @param ctx the parse tree
	 */
	void exitTitle(sequenceParser.TitleContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#head}.
	 * @param ctx the parse tree
	 */
	void enterHead(sequenceParser.HeadContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#head}.
	 * @param ctx the parse tree
	 */
	void exitHead(sequenceParser.HeadContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#group}.
	 * @param ctx the parse tree
	 */
	void enterGroup(sequenceParser.GroupContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#group}.
	 * @param ctx the parse tree
	 */
	void exitGroup(sequenceParser.GroupContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#starterExp}.
	 * @param ctx the parse tree
	 */
	void enterStarterExp(sequenceParser.StarterExpContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#starterExp}.
	 * @param ctx the parse tree
	 */
	void exitStarterExp(sequenceParser.StarterExpContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#starter}.
	 * @param ctx the parse tree
	 */
	void enterStarter(sequenceParser.StarterContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#starter}.
	 * @param ctx the parse tree
	 */
	void exitStarter(sequenceParser.StarterContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#participant}.
	 * @param ctx the parse tree
	 */
	void enterParticipant(sequenceParser.ParticipantContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#participant}.
	 * @param ctx the parse tree
	 */
	void exitParticipant(sequenceParser.ParticipantContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#stereotype}.
	 * @param ctx the parse tree
	 */
	void enterStereotype(sequenceParser.StereotypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#stereotype}.
	 * @param ctx the parse tree
	 */
	void exitStereotype(sequenceParser.StereotypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#label}.
	 * @param ctx the parse tree
	 */
	void enterLabel(sequenceParser.LabelContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#label}.
	 * @param ctx the parse tree
	 */
	void exitLabel(sequenceParser.LabelContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#participantType}.
	 * @param ctx the parse tree
	 */
	void enterParticipantType(sequenceParser.ParticipantTypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#participantType}.
	 * @param ctx the parse tree
	 */
	void exitParticipantType(sequenceParser.ParticipantTypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#name}.
	 * @param ctx the parse tree
	 */
	void enterName(sequenceParser.NameContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#name}.
	 * @param ctx the parse tree
	 */
	void exitName(sequenceParser.NameContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#width}.
	 * @param ctx the parse tree
	 */
	void enterWidth(sequenceParser.WidthContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#width}.
	 * @param ctx the parse tree
	 */
	void exitWidth(sequenceParser.WidthContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#block}.
	 * @param ctx the parse tree
	 */
	void enterBlock(sequenceParser.BlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#block}.
	 * @param ctx the parse tree
	 */
	void exitBlock(sequenceParser.BlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#ret}.
	 * @param ctx the parse tree
	 */
	void enterRet(sequenceParser.RetContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#ret}.
	 * @param ctx the parse tree
	 */
	void exitRet(sequenceParser.RetContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#divider}.
	 * @param ctx the parse tree
	 */
	void enterDivider(sequenceParser.DividerContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#divider}.
	 * @param ctx the parse tree
	 */
	void exitDivider(sequenceParser.DividerContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#stat}.
	 * @param ctx the parse tree
	 */
	void enterStat(sequenceParser.StatContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#stat}.
	 * @param ctx the parse tree
	 */
	void exitStat(sequenceParser.StatContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#par}.
	 * @param ctx the parse tree
	 */
	void enterPar(sequenceParser.ParContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#par}.
	 * @param ctx the parse tree
	 */
	void exitPar(sequenceParser.ParContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#opt}.
	 * @param ctx the parse tree
	 */
	void enterOpt(sequenceParser.OptContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#opt}.
	 * @param ctx the parse tree
	 */
	void exitOpt(sequenceParser.OptContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#creation}.
	 * @param ctx the parse tree
	 */
	void enterCreation(sequenceParser.CreationContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#creation}.
	 * @param ctx the parse tree
	 */
	void exitCreation(sequenceParser.CreationContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#creationBody}.
	 * @param ctx the parse tree
	 */
	void enterCreationBody(sequenceParser.CreationBodyContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#creationBody}.
	 * @param ctx the parse tree
	 */
	void exitCreationBody(sequenceParser.CreationBodyContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#message}.
	 * @param ctx the parse tree
	 */
	void enterMessage(sequenceParser.MessageContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#message}.
	 * @param ctx the parse tree
	 */
	void exitMessage(sequenceParser.MessageContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#messageBody}.
	 * @param ctx the parse tree
	 */
	void enterMessageBody(sequenceParser.MessageBodyContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#messageBody}.
	 * @param ctx the parse tree
	 */
	void exitMessageBody(sequenceParser.MessageBodyContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#func}.
	 * @param ctx the parse tree
	 */
	void enterFunc(sequenceParser.FuncContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#func}.
	 * @param ctx the parse tree
	 */
	void exitFunc(sequenceParser.FuncContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#from}.
	 * @param ctx the parse tree
	 */
	void enterFrom(sequenceParser.FromContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#from}.
	 * @param ctx the parse tree
	 */
	void exitFrom(sequenceParser.FromContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#to}.
	 * @param ctx the parse tree
	 */
	void enterTo(sequenceParser.ToContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#to}.
	 * @param ctx the parse tree
	 */
	void exitTo(sequenceParser.ToContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#signature}.
	 * @param ctx the parse tree
	 */
	void enterSignature(sequenceParser.SignatureContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#signature}.
	 * @param ctx the parse tree
	 */
	void exitSignature(sequenceParser.SignatureContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#invocation}.
	 * @param ctx the parse tree
	 */
	void enterInvocation(sequenceParser.InvocationContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#invocation}.
	 * @param ctx the parse tree
	 */
	void exitInvocation(sequenceParser.InvocationContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#assignment}.
	 * @param ctx the parse tree
	 */
	void enterAssignment(sequenceParser.AssignmentContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#assignment}.
	 * @param ctx the parse tree
	 */
	void exitAssignment(sequenceParser.AssignmentContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#asyncMessage}.
	 * @param ctx the parse tree
	 */
	void enterAsyncMessage(sequenceParser.AsyncMessageContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#asyncMessage}.
	 * @param ctx the parse tree
	 */
	void exitAsyncMessage(sequenceParser.AsyncMessageContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#content}.
	 * @param ctx the parse tree
	 */
	void enterContent(sequenceParser.ContentContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#content}.
	 * @param ctx the parse tree
	 */
	void exitContent(sequenceParser.ContentContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#construct}.
	 * @param ctx the parse tree
	 */
	void enterConstruct(sequenceParser.ConstructContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#construct}.
	 * @param ctx the parse tree
	 */
	void exitConstruct(sequenceParser.ConstructContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#type}.
	 * @param ctx the parse tree
	 */
	void enterType(sequenceParser.TypeContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#type}.
	 * @param ctx the parse tree
	 */
	void exitType(sequenceParser.TypeContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#assignee}.
	 * @param ctx the parse tree
	 */
	void enterAssignee(sequenceParser.AssigneeContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#assignee}.
	 * @param ctx the parse tree
	 */
	void exitAssignee(sequenceParser.AssigneeContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#methodName}.
	 * @param ctx the parse tree
	 */
	void enterMethodName(sequenceParser.MethodNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#methodName}.
	 * @param ctx the parse tree
	 */
	void exitMethodName(sequenceParser.MethodNameContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#parameters}.
	 * @param ctx the parse tree
	 */
	void enterParameters(sequenceParser.ParametersContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#parameters}.
	 * @param ctx the parse tree
	 */
	void exitParameters(sequenceParser.ParametersContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#parameter}.
	 * @param ctx the parse tree
	 */
	void enterParameter(sequenceParser.ParameterContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#parameter}.
	 * @param ctx the parse tree
	 */
	void exitParameter(sequenceParser.ParameterContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#declaration}.
	 * @param ctx the parse tree
	 */
	void enterDeclaration(sequenceParser.DeclarationContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#declaration}.
	 * @param ctx the parse tree
	 */
	void exitDeclaration(sequenceParser.DeclarationContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#tcf}.
	 * @param ctx the parse tree
	 */
	void enterTcf(sequenceParser.TcfContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#tcf}.
	 * @param ctx the parse tree
	 */
	void exitTcf(sequenceParser.TcfContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#tryBlock}.
	 * @param ctx the parse tree
	 */
	void enterTryBlock(sequenceParser.TryBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#tryBlock}.
	 * @param ctx the parse tree
	 */
	void exitTryBlock(sequenceParser.TryBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#catchBlock}.
	 * @param ctx the parse tree
	 */
	void enterCatchBlock(sequenceParser.CatchBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#catchBlock}.
	 * @param ctx the parse tree
	 */
	void exitCatchBlock(sequenceParser.CatchBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#finallyBlock}.
	 * @param ctx the parse tree
	 */
	void enterFinallyBlock(sequenceParser.FinallyBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#finallyBlock}.
	 * @param ctx the parse tree
	 */
	void exitFinallyBlock(sequenceParser.FinallyBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#alt}.
	 * @param ctx the parse tree
	 */
	void enterAlt(sequenceParser.AltContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#alt}.
	 * @param ctx the parse tree
	 */
	void exitAlt(sequenceParser.AltContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#ifBlock}.
	 * @param ctx the parse tree
	 */
	void enterIfBlock(sequenceParser.IfBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#ifBlock}.
	 * @param ctx the parse tree
	 */
	void exitIfBlock(sequenceParser.IfBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#elseIfBlock}.
	 * @param ctx the parse tree
	 */
	void enterElseIfBlock(sequenceParser.ElseIfBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#elseIfBlock}.
	 * @param ctx the parse tree
	 */
	void exitElseIfBlock(sequenceParser.ElseIfBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#elseBlock}.
	 * @param ctx the parse tree
	 */
	void enterElseBlock(sequenceParser.ElseBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#elseBlock}.
	 * @param ctx the parse tree
	 */
	void exitElseBlock(sequenceParser.ElseBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#braceBlock}.
	 * @param ctx the parse tree
	 */
	void enterBraceBlock(sequenceParser.BraceBlockContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#braceBlock}.
	 * @param ctx the parse tree
	 */
	void exitBraceBlock(sequenceParser.BraceBlockContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#loop}.
	 * @param ctx the parse tree
	 */
	void enterLoop(sequenceParser.LoopContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#loop}.
	 * @param ctx the parse tree
	 */
	void exitLoop(sequenceParser.LoopContext ctx);
	/**
	 * Enter a parse tree produced by the {@code assignmentExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterAssignmentExpr(sequenceParser.AssignmentExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code assignmentExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitAssignmentExpr(sequenceParser.AssignmentExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code funcExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterFuncExpr(sequenceParser.FuncExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code funcExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitFuncExpr(sequenceParser.FuncExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code atomExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterAtomExpr(sequenceParser.AtomExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code atomExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitAtomExpr(sequenceParser.AtomExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code orExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterOrExpr(sequenceParser.OrExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code orExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitOrExpr(sequenceParser.OrExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code additiveExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterAdditiveExpr(sequenceParser.AdditiveExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code additiveExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitAdditiveExpr(sequenceParser.AdditiveExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code relationalExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterRelationalExpr(sequenceParser.RelationalExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code relationalExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitRelationalExpr(sequenceParser.RelationalExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code plusExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterPlusExpr(sequenceParser.PlusExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code plusExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitPlusExpr(sequenceParser.PlusExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code notExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterNotExpr(sequenceParser.NotExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code notExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitNotExpr(sequenceParser.NotExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code unaryMinusExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterUnaryMinusExpr(sequenceParser.UnaryMinusExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code unaryMinusExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitUnaryMinusExpr(sequenceParser.UnaryMinusExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code creationExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterCreationExpr(sequenceParser.CreationExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code creationExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitCreationExpr(sequenceParser.CreationExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code parenthesizedExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterParenthesizedExpr(sequenceParser.ParenthesizedExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code parenthesizedExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitParenthesizedExpr(sequenceParser.ParenthesizedExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code multiplicationExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterMultiplicationExpr(sequenceParser.MultiplicationExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code multiplicationExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitMultiplicationExpr(sequenceParser.MultiplicationExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code equalityExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterEqualityExpr(sequenceParser.EqualityExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code equalityExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitEqualityExpr(sequenceParser.EqualityExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code andExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void enterAndExpr(sequenceParser.AndExprContext ctx);
	/**
	 * Exit a parse tree produced by the {@code andExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 */
	void exitAndExpr(sequenceParser.AndExprContext ctx);
	/**
	 * Enter a parse tree produced by the {@code numberAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void enterNumberAtom(sequenceParser.NumberAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code numberAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void exitNumberAtom(sequenceParser.NumberAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code booleanAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void enterBooleanAtom(sequenceParser.BooleanAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code booleanAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void exitBooleanAtom(sequenceParser.BooleanAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code idAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void enterIdAtom(sequenceParser.IdAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code idAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void exitIdAtom(sequenceParser.IdAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code stringAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void enterStringAtom(sequenceParser.StringAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code stringAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void exitStringAtom(sequenceParser.StringAtomContext ctx);
	/**
	 * Enter a parse tree produced by the {@code nilAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void enterNilAtom(sequenceParser.NilAtomContext ctx);
	/**
	 * Exit a parse tree produced by the {@code nilAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 */
	void exitNilAtom(sequenceParser.NilAtomContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#parExpr}.
	 * @param ctx the parse tree
	 */
	void enterParExpr(sequenceParser.ParExprContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#parExpr}.
	 * @param ctx the parse tree
	 */
	void exitParExpr(sequenceParser.ParExprContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#condition}.
	 * @param ctx the parse tree
	 */
	void enterCondition(sequenceParser.ConditionContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#condition}.
	 * @param ctx the parse tree
	 */
	void exitCondition(sequenceParser.ConditionContext ctx);
	/**
	 * Enter a parse tree produced by {@link sequenceParser#inExpr}.
	 * @param ctx the parse tree
	 */
	void enterInExpr(sequenceParser.InExprContext ctx);
	/**
	 * Exit a parse tree produced by {@link sequenceParser#inExpr}.
	 * @param ctx the parse tree
	 */
	void exitInExpr(sequenceParser.InExprContext ctx);
}