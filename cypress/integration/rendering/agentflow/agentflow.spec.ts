import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('Agentflow diagram', () => {
  it('1: should render basic agent/flow/task with nested containers', () => {
    imgSnapshotTest(
      `agentflow LR
        agent a1["Code Review Agent"]
          flow f1["Review Pipeline"]
            task t1["Extract Changes"]
              receive_pr("Receive PR")
              analysis["Code Analysis"]
              receive_pr --> analysis
            end
            task t2["Assess Risk"]
              evaluate("Evaluate")
              risk["Risk Assessment"]
              evaluate --> risk
            end
            t1 --> t2
          end
        end
      `,
      {}
    );
  });

  it('2: should render all four edge types', () => {
    imgSnapshotTest(
      `agentflow TB
        A["Data Source"] --> B["Process"]
        B --o C["Schema Ref"]
        B --- D["Style Guide"]
        E["Category"] -->> F["Subcategory"]
      `,
      {}
    );
  });

  it('3: should render permit tree with -->> hierarchy edges', () => {
    imgSnapshotTest(
      `agentflow TB
        llm["llm"]
        llm_query["llm.query"]
        net["net"]
        net_read["net.read"]
        llm -->> llm_query
        net -->> net_read

        llm@{ shape: hex }
        llm_query@{ shape: terminal }
        net@{ shape: hex }
        net_read@{ shape: terminal }
      `,
      {}
    );
  });

  it('4: should render collapsed view', () => {
    imgSnapshotTest(
      `agentflow LR
        agent a1["Agent One"]
          step1["Step 1"]
          step2["Step 2"]
          step1 --> step2
        end
        agent a2["Agent Two"]
          step3["Step 3"]
        end
        a1@{ view: "collapsed" }
        a1 --> a2
      `,
      {}
    );
  });

  it('4b: should render input-value pattern with `value`/`example` (v0.6.0 §19.12)', () => {
    imgSnapshotTest(
      `agentflow TB
        file_path["file_path"]
        file_path@{ shape: lean-right, description: "Path to the file in the GitHub repository to visualize", value: "src/HelloWorld.java" }

        sample_payload["sample_payload"]
        sample_payload@{ shape: doc, example: "illustrative payload" }

        read_file["read_file"]
        read_file@{ shape: subroutine, params: "path :: String", returns: "String", requires: ["fs.read"] }

        agent runner["Runner"]
          task step["Read"]
            file_path ==>|path| read_file
          end
        end
        runner@{ permits: ["fs.read"] }
      `,
      {}
    );
  });

  it('5: should render various node shapes', () => {
    imgSnapshotTest(
      `agentflow TB
        input["City Input"]
        tool["research_location"]
        output["Research Brief"]
        style_ref["Nordic Design"]
        type_ref["CoffeeCopy"]

        input --> tool --> output
        tool --- style_ref
        tool --o type_ref

        input@{ shape: lean-right }
        tool@{ shape: subroutine }
        output@{ shape: doc }
        style_ref@{ shape: lin-doc }
        type_ref@{ shape: procs }
      `,
      {}
    );
  });

  it('6: should render the v7 Coffee Website Builder diagram', () => {
    imgSnapshotTest(
      `agentflow TB
        type CoffeeCopy = Record {
          hero_tagline: String
          hero_subtitle: String
          about: String
          menu_item: String * 6
        }

        type BilingualPage = Record {
          english: String
          swedish: String
        }

        agent coffee_team["Coffee Team"]
          flow build_site["Build Site"]
            agent researcher["Researcher"]
              task step1["Research Location"]
                city["city"]
                research_loc["research_location"]
                brief["Research Brief"]
                city --> research_loc --> brief
              end
              task step2["Write Copy"]
                write_copy["write_copy"]
                english_copy["English Copy"]
                brief --> write_copy --> english_copy
                write_copy --o coffee_copy_ref
              end
              step1 --> step2
            end

            agent translator["Translator"]
              task step3["Translate to Swedish"]
                translate_sv["translate_to_swedish"]
                bilingual["Bilingual Page"]
                english_copy --> translate_sv --> bilingual
                translate_sv --o bilingual_page_ref
              end
            end

            agent designer["Designer"]
              task step4["Generate Website"]
                gen_html["generate_html"]
                html_out["HTML Website"]
                bilingual --> gen_html --> html_out
              end
              nordic["nordic_design"]
              glass["glassmorphism"]
              scroll["scroll_animations"]
              toggle["bilingual_toggle"]
              gen_html --- nordic
              gen_html --- glass
              gen_html --- scroll
              gen_html --- toggle
            end
          end
        end

        coffee_copy_ref["CoffeeCopy"]
        bilingual_page_ref["BilingualPage"]
        permit_ref["Permission Tree"]

        city@{ shape: lean-right }
        brief@{ shape: doc }
        english_copy@{ shape: doc }
        bilingual@{ shape: doc }
        html_out@{ shape: doc }
        nordic@{ shape: lin-doc }
        glass@{ shape: lin-doc }
        scroll@{ shape: lin-doc }
        toggle@{ shape: lin-doc }
        coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }
        bilingual_page_ref@{ shape: procs, type: "BilingualPage" }
        permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

        research_loc@{ shape: subroutine, returns: "String", requires: "^net.read" }
        write_copy@{ shape: subroutine, returns: "CoffeeCopy", requires: "^llm.query" }
        translate_sv@{ shape: subroutine, returns: "BilingualPage", requires: "^llm.query" }
        gen_html@{ shape: subroutine, returns: "String", requires: "^llm.query" }

        researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
        translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
        designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

        build_site@{ params: "city :: String", returns: "String" }
      `,
      {}
    );
  });

  it('7a: should render synthesized connectors-group expanded (§9)', () => {
    imgSnapshotTest(
      `agentflow LR
        github_api["GitHub API"]
        github_api@{ protocol: "https", endpoint: "https://api.github.com" }
        slack_api["Slack API"]
        slack_api@{ protocol: "https", endpoint: "https://slack.com/api" }
        connectors@{ view: "expanded" }
      `,
      {}
    );
  });

  it('7b: should render synthesized connectors-group collapsed (§9)', () => {
    imgSnapshotTest(
      `agentflow LR
        consumer["Tool"]
        consumer@{ shape: subroutine, connectorRef: "github_api" }
        github_api["GitHub API"]
        github_api@{ protocol: "https", endpoint: "https://api.github.com" }
        slack_api["Slack API"]
        slack_api@{ protocol: "https", endpoint: "https://slack.com/api" }
        connectors@{ view: "collapsed" }
      `,
      {}
    );
  });

  it('8: should redirect cross-boundary edges to the collapsed parent (#53)', () => {
    imgSnapshotTest(
      `agentflow TB
        agent researcher["Research Agent"]
          task research["Research"]
            patterns["Pattern Research"]@{ shape: doc }
          end
        end

        agent reviewer["Review Agent"]
          task review["Review"]
            validate["validate_patterns"]@{ shape: subroutine }
            reviewed["Reviewed Patterns"]@{ shape: doc }
            patterns --> validate --> reviewed
          end
        end

        agent reporter["Report Agent"]
          task generate["Generate"]
            compile["compile_report"]@{ shape: subroutine }
            reviewed --> compile
          end
        end

        reviewer@{ view: "collapsed" }
      `,
      {}
    );
  });
});
