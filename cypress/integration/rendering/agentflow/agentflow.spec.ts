import { imgSnapshotTest } from '../../../helpers/util.ts';

// Diagrams below use agentflow v0.8.2 syntax (AGENTFLOW-SYNTAX.md): `flow` is
// the single container kind; the edge set is `-->` (sequence), `-.-`
// (reference), `--x` (failure); shapes are authored via the v0.8.1 aliases
// (task, tool, input, decision, refdoc, action); connectors are declared with
// the `connector` keyword.
describe('Agentflow diagram', () => {
  it('1: should render nested flow containers', () => {
    imgSnapshotTest(
      `agentflow LR
        flow review_agent["Code Review Agent"]
          flow pipeline["Review Pipeline"]
            flow extract["Extract Changes"]
              receive_pr("Receive PR")
              analysis["Code Analysis"]
              receive_pr --> analysis
            end
            flow assess["Assess Risk"]
              evaluate("Evaluate")
              risk["Risk Assessment"]
              evaluate --> risk
            end
            extract --> assess
          end
        end
      `,
      {}
    );
  });

  it('2: should render all three edge types plus a labeled branch', () => {
    imgSnapshotTest(
      `agentflow TB
        A["Data Source"] --> B["Process"]
        B -.- C["Schema Ref"]
        B --x D["Failure Handler"]
        E["Decision"] -- yes --> F["Approved"]
        C@{ shape: refdoc }
        E@{ shape: decision }
      `,
      {}
    );
  });

  it('3: should render a decision with labeled branches', () => {
    imgSnapshotTest(
      `agentflow TB
        triage["Triage"]@{ shape: decision }
        triage -- bug --> bugfix["Bug Fix"]
        triage -- feature --> feature_work["Feature Work"]
        triage -- question --> answer["Answer"]
      `,
      {}
    );
  });

  it('4: should render collapsed view', () => {
    imgSnapshotTest(
      `agentflow LR
        flow f1["Flow One"]
          step1["Step 1"]
          step2["Step 2"]
          step1 --> step2
        end
        flow f2["Flow Two"]
          step3["Step 3"]
        end
        f1@{ view: "collapsed" }
        f1 --> f2
      `,
      {}
    );
  });

  it('4b: should render the input-value pattern (§10, input nodes)', () => {
    imgSnapshotTest(
      `agentflow TB
        file_path["file_path"]
        file_path@{ shape: input, description: "Path to the file in the GitHub repository to visualize", value: "src/HelloWorld.java" }

        read_file["read_file"]
        read_file@{ shape: tool, params: "path :: String", returns: "String" }

        flow runner["Runner"]
          file_path --> read_file
        end
      `,
      {}
    );
  });

  it('5: should render the v0.8 node shapes', () => {
    imgSnapshotTest(
      `agentflow TB
        city["City Input"]
        research["research_location"]
        brief["Research Brief"]
        style_ref["Nordic Design"]
        check["Quality OK?"]
        post["post_results"]

        city --> research --> brief
        research -.- style_ref
        brief --> check
        check -- yes --> post

        city@{ shape: input }
        research@{ shape: tool }
        style_ref@{ shape: refdoc }
        check@{ shape: decision }
        post@{ shape: action }
      `,
      {}
    );
  });

  it('6: should render the Coffee Website Builder diagram (v0.8 canonical form)', () => {
    imgSnapshotTest(
      `agentflow TB
        flow build_site["Build Site"]
          flow researcher["Researcher"]
            city["city"]
            research_loc["research_location"]
            brief["Research Brief"]
            city --> research_loc --> brief
            write_copy["write_copy"]
            english_copy["English Copy"]
            brief --> write_copy --> english_copy
          end

          flow translator["Translator"]
            translate_sv["translate_to_swedish"]
            bilingual["Bilingual Page"]
            english_copy --> translate_sv --> bilingual
          end

          flow designer["Designer"]
            gen_html["generate_html"]
            html_out["HTML Website"]
            bilingual --> gen_html --> html_out
            nordic["nordic_design"]
            gen_html -.- nordic
          end
        end

        city@{ shape: input, value: "Stockholm" }
        research_loc@{ shape: tool, returns: "String" }
        write_copy@{ shape: tool, returns: "CoffeeCopy" }
        translate_sv@{ shape: tool, returns: "BilingualPage" }
        gen_html@{ shape: tool, returns: "String" }
        nordic@{ shape: refdoc }

        researcher@{ model: "claude-sonnet-4-20250514", instruction: "Research the location and write the copy." }
        translator@{ model: "claude-sonnet-4-20250514" }
        designer@{ model: "claude-sonnet-4-20250514" }

        build_site@{ params: "city :: String", returns: "String" }
      `,
      {}
    );
  });

  it('7a: should render a connector declaration with a bound tool (§8)', () => {
    imgSnapshotTest(
      `agentflow LR
        connector github["GitHub API"]
        github@{ protocol: "http", endpoint: "https://api.github.com", token_required: true }

        query["query"]
        query@{ shape: input }
        fetch_issues["fetch_issues"]
        fetch_issues@{ shape: tool, connectorRef: "github.list_issues" }
        query --> fetch_issues
      `,
      {}
    );
  });

  it('7b: should render multiple connector declarations', () => {
    imgSnapshotTest(
      `agentflow LR
        connector github["GitHub API"]
        github@{ protocol: "http", endpoint: "https://api.github.com" }
        connector slack["Slack API"]
        slack@{ protocol: "http", endpoint: "https://slack.com/api" }

        notify["notify_channel"]
        notify@{ shape: action, connectorRef: "slack.post_message" }
        create_issue["create_issue"]
        create_issue@{ shape: tool, connectorRef: "github.create_issue" }
        create_issue --> notify
      `,
      {}
    );
  });

  it('8: should redirect cross-boundary edges to the collapsed parent (#53)', () => {
    imgSnapshotTest(
      `agentflow TB
        flow researcher["Research Agent"]
          patterns["Pattern Research"]@{ shape: refdoc }
        end

        flow reviewer["Review Agent"]
          validate["validate_patterns"]@{ shape: tool }
          reviewed["Reviewed Patterns"]
          patterns --> validate --> reviewed
        end

        flow reporter["Report Agent"]
          compile["compile_report"]@{ shape: tool }
          reviewed --> compile
        end

        reviewer@{ view: "collapsed" }
      `,
      {}
    );
  });

  it('9: should treat an empty/whitespace metadata block as a no-op (#83)', () => {
    // An empty multi-line `@{` `}` block used to crash the whole diagram with
    // "Cannot read properties of null (reading 'shape')".
    imgSnapshotTest(
      `agentflow TB
        newtask["Example"]@{
}
        other["Other"]@{   }
        newtask --> other
        styled["Styled"]@{ shape: task }
        other --> styled
      `,
      {}
    );
  });
});
