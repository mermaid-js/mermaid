import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Timeline diagram', () => {
  it('1: should render a simple timeline with no specific sections', () => {
    imgSnapshotTest(
      `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook : Google
    2005 : YouTube
    2006 : Twitter
      `,
      {}
    );
  });
  it('2: should render a timeline diagram with sections', () => {
    imgSnapshotTest(
      `timeline
    title Timeline of Industrial Revolution
    section 17th-20th century
        Industry 1.0 : Machinery, Water power, Steam <br>power
        Industry 2.0 : Electricity, Internal combustion engine, Mass production
        Industry 3.0 : Electronics, Computers, Automation
    section 21st century
        Industry 4.0 : Internet, Robotics, Internet of Things
        Industry 5.0 : Artificial intelligence, Big data,3D printing
      `,
      {}
    );
  });
  it('3: should render a complex timeline with sections, and long events text with <br>', () => {
    imgSnapshotTest(
      `timeline
        title England's History Timeline
        section Stone Age
          7600 BC : Britain's oldest known house was built in Orkney, Scotland
          6000 BC : Sea levels rise and Britain becomes an island.<br> The people who live here are hunter-gatherers.
        section Bronze Age
          2300 BC : People arrive from Europe and settle in Britain. <br>They bring farming and metalworking.
                  : New styles of pottery and ways of burying the dead appear.
          2200 BC : The last major building works are completed at Stonehenge.<br> People now bury their dead in stone circles.
                  : The first metal objects are made in Britain.Some other nice things happen. it is a good time to be alive.
      `,
      {}
    );
  });
  it('4: should render a simple timeline with directives and disableMultiColor:true ', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'base', 'timeline': {'disableMulticolor': true}}}%%
    timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
      `,
      {}
    );
  });
  it('5: should render a simple timeline with directive overridden colors', () => {
    imgSnapshotTest(
      ` %%{init: { 'logLevel': 'debug', 'theme': 'default' , 'themeVariables': {
              'cScale0': '#ff0000',
              'cScale1': '#00ff00',
              'cScale2': '#0000ff'
       } } }%%
       timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
          2007 : Tumblr
          2008 : Instagram
          2010 : Pinterest
      `,
      {}
    );
  });
  it('6: should render a simple timeline in base theme', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'base' } }%%
    timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
          2007 : Tumblr
          2008 : Instagram
          2010 : Pinterest
      `,
      {}
    );
  });

  it('7: should render a simple timeline in default theme', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'default' } }%%
    timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
          2007 : Tumblr
          2008 : Instagram
          2010 : Pinterest
      `,
      {}
    );
  });

  it('8: should render a simple timeline in dark theme', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'dark' } }%%
    timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
          2007 : Tumblr
          2008 : Instagram
          2010 : Pinterest
      `,
      {}
    );
  });

  it('9: should render a simple timeline in neutral theme', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'neutral' } }%%
    timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
          2007 : Tumblr
          2008 : Instagram
          2010 : Pinterest
      `,
      {}
    );
  });

  it('10: should render a simple timeline in forest theme', () => {
    imgSnapshotTest(
      `%%{init: { 'logLevel': 'debug', 'theme': 'forest' } }%%
    timeline
        title History of Social Media Platform
          2002 : LinkedIn
          2004 : Facebook : Google
          2005 : YouTube
          2006 : Twitter
          2007 : Tumblr
          2008 : Instagram
          2010 : Pinterest
      `,
      {}
    );
  });

  it('11: should render timeline with many stacked events and proper timeline line length', () => {
    imgSnapshotTest(
      `timeline
        title Medical Device Lifecycle
        section Pre-Development
          Quality Management System : Regulatory Compliance : Risk Management
        section Development
          Management Responsibility : Planning Activities : Human Resources
          Resource Management : Management Reviews : Infrastructure
        section Post-Development
          Product Realization Activities : Planning Activities : Customer-related Processes
          Post-Production Activities : Feedback : Complaints : Adverse Events
                                    : Research and Development : Purchasing Activities
                                    : Production Activities : Installation Activities
                                    : Servicing Activities : Post-Market Surveillance
      `,
      {}
    );
  });

  it('12: should render timeline with proper vertical line lengths for all columns', () => {
    imgSnapshotTest(
      `---
config:
    theme: base
    themeVariables:
        fontFamily: Fira Sans
        fontSize: 17px
        cScale0: '#b3cde0'
        cScale1: '#f49090'
        cScale2: '#85d5b8'
---

timeline
    title Medical Device Lifecycle
    section Planning
        Quality Management System (4): Regulatory Compliance (4.1.1)
            : Risk Management (4.1.2)
        Management Resposibility (5): Planning Activities (5.4)
            : Management Reviews (5.6)
         Resource Management (6): Human Resources (6.2)
            : Infrastructure (6.3)
    section Realization
        Research and Development (7.3): RnD Planning (7.3.2)
            : Inputs (7.3.3)
            : Outputs (7.3.4)
            : Review (7.3.5)
            : Verification (7.3.6)
            : Validation (7.3.7)
        Purchasing (7.4): Purchasing Process (7.4.1)
            : Purchasing Information (7.4.2)
        Production (7.5): Production Activities (7.5.1)
            : Production Feedback (8.2.1)
        Installation (7.5.3): Installation Activities (7.5.3)
        Servicing (7.5.4): Servicing Activities (7.5.4)
    section Post-Production
        Post-Market Activities (8): Feedback (8.2.1)
            : Complaints (8.2.2)
            : Adverse Events (8.2.3)
      `,
      {}
    );
  });
  it('13: should render markdown htmlLabels', () => {
    imgSnapshotTest(
      `---
config:
    theme: forest
---

 timeline
    title Timeline of Industrial Revolution
    section 17th-20th century
        Industry 1.0 : Machinery, Water power, Steam <br>power
        Industry 2.0 : Electricity, <strong>Internal combustion engine </strong>, Mass production
        Industry 3.0 : Electronics, Computers, Automation
    section 21st century
        Industry 4.0 : Internet, Robotics, Internet of Things
        Industry 5.0 : Artificial intelligence, Big data, 3D printing
      `,
      {}
    );
  });
  it('14: should render all supported HTML tags in timeline labels', () => {
    imgSnapshotTest(
      `---
config:
    theme: forest
---

 timeline
    title HTML Formatting Test
    section Text Formatting
        Event 1 : Normal text with <em>italic</em> and <strong>bold</strong> formatting
        Event 2 : Text with <sup>superscript</sup> and <br>line break
        Event 3 : Link to <a href="https://mermaid.js.org">Mermaid</a> documentation
    section Lists
        Event 4 : Unordered list: <ul><li>First item</li><li>Second item</li><li>Third item</li></ul>
        Event 5 : Paragraph with <p>multiple</p> <p>paragraphs</p>
      `,
      {}
    );
  });
});
