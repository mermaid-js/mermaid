<template>

  <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block">
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

    <!-- This element is to trick the browser into centering the modal contents. -->
    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

    <div class="z-40 inline-block align-bottom bg-white rounded-lg px-4 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-2">
      <div>
        <div class="bg-white px-4 py-5 border-b border-gray-200 sm:px-6" slot="header">
          <h3 class="text-xl leading-6 font-medium text-gray-900 inline-block">
            ZenUML Tips
          </h3>
          <button type="button" @click="closeTipsDialog()" class="float-right bg-white rounded-md inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
            <span class="sr-only">Close menu</span>
            <!-- Heroicon name: outline/x -->
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div slot="body">
          <div class="relative bg-white pb-32 mt-4 overflow-hidden">
            <div class="relative">
              <div class="lg:mx-auto lg:max-w-11/12 lg:px-8">
                <div class="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1">
                  <div>
                  <div class="px-4 max-w-full mx-auto sm:px-6 lg:max-w-none lg:mx-0">
                    <h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Declare Participants</h2>
                    <pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>// Define a Starter (optional)
@Starter(A)

// Show icons
@EC2 A

// Use 'group' keyword
group GroupName {  B  C }

// Use stereotype
&lt;&lt;servlet&gt;&gt; ServiceX</code></pre>

                  </div>
                  <div class="px-4 max-w-7xl mx-auto sm:px-6 lg:max-w-none lg:mx-0">
                    <h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Divider</h2>
                    <pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>A.method()
==divider name==
B.method()
</code></pre>
                  </div>
                  </div>
                  <div class="px-4 w-full mx-auto lg:max-w-none lg:mx-0">
                    <h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Fragments</h2>
                    <pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>// Alt (AKA if/else)
if(condition1) {}
else if (condition2) {}
else {}

// `loop`, `for`, `forEach`, `while`
// are treated the same
forEach(records) {}

// Opt
opt {}

// Par
par {}

// Try Catch Finally
try {} catch() {} finally {}
</code></pre>
                  </div>
                  <div class="px-4 w-full mx-auto lg:max-w-none lg:mx-0">
                    <h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Messages</h2>
                    <pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>//Creation
new ParticipantName()

//Sync Message
A.method
A->B.method

//Async Message
A->B: async message

//Reply Message, three styles
x = A.method
A.method() {
  return x
}
A.method() {
  @return A->B: message
}</code></pre>
                  </div>
                </div>
                <div class="px-4 max-w-7xl mx-auto sm:px-6 lg:max-w-none lg:mx-0">
                  <h2 class="mt-8 mb-4 text-lg leading-6 font-medium text-gray-900">Builtin Icons</h2>
                  <p class="text-sm text-gray-500">Use <span class="rounded inline-block bg-gray-50 text-gray-600">
                    <code class="text-xs">@Actor TheParticipant</code> </span> to define the type of the participant.</p>
                  <IconList :types="standardTypes"/>
                  <hr class="mt-4">
                  <IconList :types="awsServices" />
                  <hr class="mt-4">
                  <IconList :types="azureServices" />
                  <hr class="mt-4">
                  <IconList :types="googleServices" />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import IconList from "@/components/DiagramFrame/Tutorial/IconList";

export default {
  name: "TipsDialog",
  components: {IconList},
  computed: {
    standardTypes() {
      return [
        'Actor', 'Boundary', 'Control', 'Database', 'Entity',
      ]
    },
    awsServices() {
      return [
        'CloudWatch', 'CloudFront', 'Cognito', 'DynamoDB', 'EBS', 'EC2', 'ECS',
        'EFS', 'ElastiCache', 'ElasticBeantalk', 'ElasticFileSystem', 'Glacier',
        'IAM', 'Kinesis', 'Lambda', 'LightSail', 'RDS', 'Redshift', 'S3', 'SNS',
        'SQS', 'Sagemaker', 'VPC',
      ]
    },
    azureServices() {
      return [
        'AzureActiveDirectory', 'AzureBackup', 'AzureCDN', 'AzureDataFactory',
        'AzureDevOps', 'AzureFunction', 'AzureSQL', 'CosmosDB', 'LogicApps', 'VirtualMachine',
      ]
    },
    googleServices() {
      return [
        'BigTable', 'BigQuery', 'CloudCDN', 'CloudDNS', 'CloudInterconnect', 'CloudLoadBalancing',
        'CloudSQL', 'CloudStorage', 'DataLab', 'DataProc', 'GoogleIAM', 'GoogleSecurity',
        'GoogleVPC', 'PubSub', 'SecurityScanner', 'StackDriver', 'VisionAPI'
      ]
    },
  },
  methods: {
    closeTipsDialog() {
      this.$store.state.showTips = false
      try {
        this.$gtag?.event('close', {
          'event_category': 'help', 'event_label': 'tips dialog'
        })
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>

<style scoped>

</style>
