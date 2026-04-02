grammar VsmGrammar
import "../common/common";

entry Vsm:
    NEWLINE*
    'vsm'
    NEWLINE*
    (
        TitleAndAccessibilities
        | flow=FlowLine
        | steps+=StepBlock
        | queues+=Queue
        | summary=Summary
        | NEWLINE
    )*
;

FlowLine:
    items+=FlowItem ('>>' items+=FlowItem)*
;

FlowItem:
    FlowEndpoint | FlowProcess
;

FlowEndpoint:
    type=ENDPOINT_TYPE label=STRING
;

FlowProcess:
    name=ID
;

terminal ENDPOINT_TYPE returns string: 'supplier' | 'customer' | 'from' | 'to';

StepBlock:
    name=ID label=STRING
    NEWLINE+
    (
        metrics+=Metric
        | uptime=UptimeMetric
        | batch=BatchMetric
        | flowType=FLOW_TYPE
        | NEWLINE
    )*
;

Metric:
    type=METRIC_TYPE value=Duration
;

UptimeMetric:
    'uptime' value=NUMBER '%'
;

BatchMetric:
    'batch' value=NUMBER
;

Duration:
    min=DURATION_VALUE ('-' max=DURATION_VALUE)?
;

terminal DURATION_VALUE returns string: /[0-9]+[smhdw]/;

terminal METRIC_TYPE returns string: 'cycletime' | 'changeover';

terminal FLOW_TYPE returns string: 'push' | 'pull';

Queue:
    'queue' value=Duration
;

Summary:
    'summary' (
        all?='all'
        | (NEWLINE | items+=SUMMARY_ITEM)*
    )
;

terminal SUMMARY_ITEM returns string: 'leadtime' | 'processtime' | 'waste' | 'efficiency';
