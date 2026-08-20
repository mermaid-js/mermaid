import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('Wireframe diagram', () => {
  it('1: should render a minimal wireframe with a single button', () => {
    imgSnapshotTest(
      `wireframe-beta
  button "Click me"
`,
      {}
    );
  });

  it('2: should render a simple form with common inputs', () => {
    imgSnapshotTest(
      `wireframe-beta "Login" size=dialog
  textfield "Username"
  password "Password"
  checkbox "Remember me" checked
  button "Sign In" primary
  button "Cancel"
`,
      {}
    );
  });

  it('3: should render a multi-column layout', () => {
    imgSnapshotTest(
      `wireframe-beta "User Profile" size=desktop
  columns
    col 30%
      imagefield "Avatar"
      button "Upload" primary
    end
    col 70%
      textfield "Full Name"
      textfield "Email"
      select "Role" ["Admin", "Editor", "Viewer"]
    end
  end
`,
      {}
    );
  });

  it('4: should render a titlewindow container', () => {
    imgSnapshotTest(
      `wireframe-beta size=panel
  titlewindow "System Status"
    label "CPU Usage: 42%"
    label "Memory Usage: 68%"
    button "Restart Services"
  end
`,
      {}
    );
  });

  it('5: should render a fieldset', () => {
    imgSnapshotTest(
      `wireframe-beta size=panel
  fieldset "Contact Information"
    textfield "Phone Number"
    textfield "Address"
    select "Country" ["USA", "Canada", "UK"]
  end
`,
      {}
    );
  });

  it('6: should render tabs container', () => {
    imgSnapshotTest(
      `wireframe-beta size=panel
  tabs ["General", "Security", "Notifications"] active=1
    tab "General"
      textfield "Display Name"
      select "Language" ["English", "Spanish", "French"]
    end
    tab "Security"
      password "Current Password"
      password "New Password"
    end
    tab "Notifications"
      checkbox "Email Alerts" checked
    end
  end
`,
      {}
    );
  });

  it('7: should render an accordion', () => {
    imgSnapshotTest(
      `wireframe-beta size=panel
  accordion "Basic Settings"
    textfield "Name"
    textfield "Email"
  end
  accordion "Advanced Settings" collapsed
    checkbox "Enable Developer Mode"
    textfield "API Key"
  end
`,
      {}
    );
  });

  it('8: should render an action bar', () => {
    imgSnapshotTest(
      `wireframe-beta "Dashboard" size=panel
  actions ["Refresh"] ["Export PDF"] ["*Settings"]
  paragraph "Welcome back to your dashboard."
`,
      {}
    );
  });

  it('9: should render checkbox and radio groups', () => {
    imgSnapshotTest(
      `wireframe-beta size=panel
  checkboxgroup "Interests" ["*Coding", "Design", "Marketing"]
  radiogroup "Priority" ["Low", "*Medium", "High"]
`,
      {}
    );
  });

  it('10: should render a complex full-screen wireframe', () => {
    imgSnapshotTest(
      `wireframe-beta "Project Dashboard" size=desktop
  actions ["Help"] ["*Save"] ["Cancel"]
  columns
    col 25%
      titlewindow "Navigation"
        list "Menu" ["Dashboard", "Projects", "Reports", "Settings"]
      end
    end
    col 75%
      titlewindow "Project Details"
        textfield "Project Name"
        textarea "Description" rows=3
        columns
          col 50%
            datepicker "Start Date"
          end
          col 50%
            datepicker "End Date"
          end
        end
        select "Status" ["Planning", "In Progress", "Done"]
        checkboxgroup "Notify" ["*Email", "Slack"]
        button "Save Changes" primary
      end
    end
  end
`,
      {}
    );
  });

  it('11: should render a section with alignTo positioning', () => {
    imgSnapshotTest(
      `wireframe-beta size=panel
  section "Primary" id=sec1
    textfield "Search"
    button "Submit" primary
  end
  section "Secondary" alignTo=sec1
    label "Results will appear here"
  end
`,
      {}
    );
  });

  it('12: should render a showTabs multi-pane view', () => {
    imgSnapshotTest(
      `wireframe-beta size=desktop
  tabs ["Tab A", "Tab B"] showTabs="1,2"
    tab "Tab A"
      textfield "First Name"
      textfield "Last Name"
    end
    tab "Tab B"
      radiogroup "Option" ["*Choice 1", "Choice 2"]
    end
  end
`,
      {}
    );
  });

  it('13: should render correctly with the dark theme', () => {
    imgSnapshotTest(
      `wireframe-beta "Dark Theme Preview" size=panel
  textfield "Username"
  password "Password"
  button "Sign In" primary
  button "Cancel"
`,
      { theme: 'dark' }
    );
  });

  it('14: should render correctly with the neutral theme', () => {
    imgSnapshotTest(
      `wireframe-beta "Neutral Theme Preview" size=panel
  textfield "Search"
  button "Submit" primary
  label "Results will appear here"
`,
      { theme: 'neutral' }
    );
  });
});
