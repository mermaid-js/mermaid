// Generated from /Users/pengxiao/workspaces/zenuml/zenuml-core/src/g4/sequenceParser.g4 by ANTLR 4.10.1
import org.antlr.v4.runtime.tree.ParseTreeVisitor;

/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by {@link sequenceParser}.
 *
 * @param <T> The return type of the visit operation. Use {@link Void} for
 * operations with no return type.
 */
public interface sequenceParserVisitor<T> extends ParseTreeVisitor<T> {
	/**
	 * Visit a parse tree produced by {@link sequenceParser#prog}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitProg(sequenceParser.ProgContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#title}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitTitle(sequenceParser.TitleContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#head}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitHead(sequenceParser.HeadContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#group}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitGroup(sequenceParser.GroupContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#starterExp}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStarterExp(sequenceParser.StarterExpContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#starter}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStarter(sequenceParser.StarterContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#participant}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParticipant(sequenceParser.ParticipantContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#stereotype}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStereotype(sequenceParser.StereotypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#label}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitLabel(sequenceParser.LabelContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#participantType}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParticipantType(sequenceParser.ParticipantTypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#name}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitName(sequenceParser.NameContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#width}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitWidth(sequenceParser.WidthContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#block}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBlock(sequenceParser.BlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#ret}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitRet(sequenceParser.RetContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#divider}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDivider(sequenceParser.DividerContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#stat}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStat(sequenceParser.StatContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#par}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitPar(sequenceParser.ParContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#opt}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitOpt(sequenceParser.OptContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#creation}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCreation(sequenceParser.CreationContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#creationBody}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCreationBody(sequenceParser.CreationBodyContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#message}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMessage(sequenceParser.MessageContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#messageBody}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMessageBody(sequenceParser.MessageBodyContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#func}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitFunc(sequenceParser.FuncContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#from}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitFrom(sequenceParser.FromContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#to}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitTo(sequenceParser.ToContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#signature}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitSignature(sequenceParser.SignatureContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#invocation}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitInvocation(sequenceParser.InvocationContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#assignment}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAssignment(sequenceParser.AssignmentContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#asyncMessage}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAsyncMessage(sequenceParser.AsyncMessageContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#content}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitContent(sequenceParser.ContentContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#construct}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitConstruct(sequenceParser.ConstructContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#type}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitType(sequenceParser.TypeContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#assignee}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAssignee(sequenceParser.AssigneeContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#methodName}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMethodName(sequenceParser.MethodNameContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#parameters}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParameters(sequenceParser.ParametersContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#parameter}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParameter(sequenceParser.ParameterContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#declaration}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitDeclaration(sequenceParser.DeclarationContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#tcf}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitTcf(sequenceParser.TcfContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#tryBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitTryBlock(sequenceParser.TryBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#catchBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCatchBlock(sequenceParser.CatchBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#finallyBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitFinallyBlock(sequenceParser.FinallyBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#alt}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAlt(sequenceParser.AltContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#ifBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIfBlock(sequenceParser.IfBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#elseIfBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitElseIfBlock(sequenceParser.ElseIfBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#elseBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitElseBlock(sequenceParser.ElseBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#braceBlock}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBraceBlock(sequenceParser.BraceBlockContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#loop}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitLoop(sequenceParser.LoopContext ctx);
	/**
	 * Visit a parse tree produced by the {@code assignmentExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAssignmentExpr(sequenceParser.AssignmentExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code funcExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitFuncExpr(sequenceParser.FuncExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code atomExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAtomExpr(sequenceParser.AtomExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code orExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitOrExpr(sequenceParser.OrExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code additiveExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAdditiveExpr(sequenceParser.AdditiveExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code relationalExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitRelationalExpr(sequenceParser.RelationalExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code plusExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitPlusExpr(sequenceParser.PlusExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code notExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitNotExpr(sequenceParser.NotExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code unaryMinusExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitUnaryMinusExpr(sequenceParser.UnaryMinusExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code creationExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCreationExpr(sequenceParser.CreationExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code parenthesizedExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParenthesizedExpr(sequenceParser.ParenthesizedExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code multiplicationExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitMultiplicationExpr(sequenceParser.MultiplicationExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code equalityExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitEqualityExpr(sequenceParser.EqualityExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code andExpr}
	 * labeled alternative in {@link sequenceParser#expr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitAndExpr(sequenceParser.AndExprContext ctx);
	/**
	 * Visit a parse tree produced by the {@code numberAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitNumberAtom(sequenceParser.NumberAtomContext ctx);
	/**
	 * Visit a parse tree produced by the {@code booleanAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitBooleanAtom(sequenceParser.BooleanAtomContext ctx);
	/**
	 * Visit a parse tree produced by the {@code idAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitIdAtom(sequenceParser.IdAtomContext ctx);
	/**
	 * Visit a parse tree produced by the {@code stringAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitStringAtom(sequenceParser.StringAtomContext ctx);
	/**
	 * Visit a parse tree produced by the {@code nilAtom}
	 * labeled alternative in {@link sequenceParser#atom}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitNilAtom(sequenceParser.NilAtomContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#parExpr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitParExpr(sequenceParser.ParExprContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#condition}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitCondition(sequenceParser.ConditionContext ctx);
	/**
	 * Visit a parse tree produced by {@link sequenceParser#inExpr}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitInExpr(sequenceParser.InExprContext ctx);
}