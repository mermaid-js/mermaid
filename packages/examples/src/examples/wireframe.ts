import type { DiagramMetadata } from '../types.js';

export default {
  id: 'wireframe',
  name: 'Wireframe Diagram',
  description: 'Create low-fidelity UI mockups and wireframes',
  examples: [
    {
      title: 'User Settings Form',
      isDefault: true,
      code: `wireframe "User Profile Settings" size=desktop
actions [Cancel] ["*Save Changes"]

section "Personal Information"
  columns
    col
      textfield "First Name"
    end
    col
      textfield "Last Name"
    end
  end
  textfield "Email Address"
  select "Role" [Admin, Developer, Designer, Viewer]
end

section "Preferences"
  checkbox "Subscribe to newsletter" checked
  radiogroup "Theme" [Light, *Dark, System]
end`,
    },
    {
      title: 'Dashboard Grid & Panels',
      code: `wireframe "Analytics Dashboard" size=desktop
columns
  col
    titlewindow "System Metrics"
      icon "Server Status" glyph="server"
      heading "System Metrics Overview"
      paragraph "All servers running normally."
    end
  end
  col
    titlewindow "Quick Actions"
      button "Export Data"
      button "Refresh Feed"
    end
  end
end`,
    },
    {
      title: 'Login Dialog',
      code: `wireframe "User Login" size=dialog
actions ["*Login"]

textfield "Username or Email"
password "Password"
checkbox "Remember me on this device" checked`,
    },
    {
      title: 'Multi-Tab Preview (showTabs)',
      code: `wireframe "Multi-Tab Settings" size=panel
tabs ["General", "Security", "Notifications"] showTabs="general,security"
  tab "General"
    textfield "Username"
    select "Language" [English, Spanish, French]
  end
  tab "Security"
    password "Current Password"
    password "New Password"
  end
  tab "Notifications"
    checkbox "Email Alerts" checked
  end
end`,
    },
  ],
} satisfies DiagramMetadata;
