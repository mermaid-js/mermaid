<template>
  <!-- Set the background and text color with bg-skin-base and text-skin-base.
       Override background color if it is defined in participant declaration (e.g. A #FFFFFF).
       TODO: Add a default .selected style
   -->
  <div class="participant bg-skin-participant border-skin-participant text-skin-participant rounded text-base leading-4 relative flex flex-col justify-center z-10 h-10"
       :class="{'selected': selected, 'border-transparent': !!icon}"
       ref="participant"
       :style="{backgroundColor: backgroundColor, color: color}"
       @click="onSelect">
    <img v-if="!!icon" :src="icon" class="absolute left-1/2 transform -translate-x-1/2 -translate-y-full h-8" :alt="`icon for ${entity.name}`">
    <!-- Put in a div to give it a fixed height, because stereotype is dynamic. -->
    <div class="h-5 group flex flex-col justify-center">
      <span v-if="!!comment" class="absolute hidden rounded-lg transform -translate-y-8 bg-gray-400 px-2 py-1 text-center text-sm text-white group-hover:flex">
        {{comment}}
      </span>
      <label class="interface leading-4" v-if="stereotype">«{{ stereotype }}»</label>
      <label class="name leading-4">{{ entity.label || entity.name }}</label>
    </div>
  </div>
</template>

<script>
import {brightnessIgnoreAlpha, removeAlpha} from '../../../../utils/Color'
const iconPath = {
  actor:      require('../../../../assets/actor.svg'),
  boundary:   require('../../../../assets/Robustness_Diagram_Boundary.svg'),
  control:    require('../../../../assets/Robustness_Diagram_Control.svg'),
  database:   require('../../../../assets/database.svg'),
  entity:     require('../../../../assets/Robustness_Diagram_Entity.svg'),
  // AWS service
  cloudwatch:             require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Management-Governance/16/Arch_Amazon-CloudWatch_16.svg'),
  cloudfront:             require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Networking-Content-Delivery/16/Arch_Amazon-CloudFront_16.svg'),
  cognito:                require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Security-Identity-Compliance/16/Arch_Amazon-Cognito_16.svg'),
  dynamodb:               require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Database/16/Arch_Amazon-DynamoDB_16.svg'),
  ebs:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Elastic-Block-Store_16.svg'),
  ec2:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_Amazon-EC2_16.svg'),
  ecs:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_Amazon-Elastic-Container-Service_16.svg'),
  efs:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Elastic-File-System_16.svg'),
  elasticache:            require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Database/16/Arch_Amazon-ElastiCache_16.svg'),
  elasticbeantalk:        require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_AWS-Elastic-Beanstalk_16.svg'),
  elasticfilesystem:      require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Elastic-File-System_16.svg'),
  glacier:                require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Simple-Storage-Service-Glacier_16.svg'),
  iam:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Security-Identity-Compliance/16/Arch_AWS-Identity-and-Access-Management_16.svg'),
  kinesis:                require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Analytics/Arch_16/Arch_Amazon-Kinesis_16.svg'),
  lambda:                 require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_AWS-Lambda_16.svg'),
  lightsail:              require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_Amazon-Lightsail_16.svg'),
  rds:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Database/16/Arch_Amazon-RDS_16.svg'),
  redshift:               require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Analytics/Arch_16/Arch_Amazon-Redshift_16.svg'),
  s3:                     require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Simple-Storage-Service_16.svg'),
  sns:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_App-Integration/Arch_16/Arch_Amazon-Simple-Notification-Service_16.svg'),
  sqs:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_App-Integration/Arch_16/Arch_Amazon-Simple-Queue-Service_16.svg'),
  sagemaker:              require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Machine-Learning/16/Arch_Amazon-SageMaker_16.svg'),
  vpc:                    require('../../../../assets/Architecture-Service-Icons_09172021/Arch_Networking-Content-Delivery/16/Arch_Amazon-Virtual-Private-Cloud_16.svg'),
  // Azure services
  azureactivedirectory:   require('../../../../assets/Azure_Public_Service_Icons/Icons/Identity/10221-icon-service-Azure-Active-Directory.svg'),
  azurebackup:            require('../../../../assets/Azure_Public_Service_Icons/Icons/Azure Stack/10108-icon-service-Infrastructure-Backup.svg'),
  azurecdn:               require('../../../../assets/Azure_Public_Service_Icons/Icons/App Services/00056-icon-service-CDN-Profiles.svg'),
  azuredatafactory:       require('../../../../assets/Azure_Public_Service_Icons/Icons/Databases/10126-icon-service-Data-Factory.svg'),
  azuredevops:            require('../../../../assets/Azure_Public_Service_Icons/Icons/DevOps/10261-icon-service-Azure-DevOps.svg'),
  azurefunction:          require('../../../../assets/Azure_Public_Service_Icons/Icons/Compute/10029-icon-service-Function-Apps.svg'),
  azuresql:               require('../../../../assets/Azure_Public_Service_Icons/Icons/Databases/02390-icon-service-Azure-SQL.svg'),
  cosmosdb:               require('../../../../assets/Azure_Public_Service_Icons/Icons/Databases/10121-icon-service-Azure-Cosmos-DB.svg'),
  logicapps:              require('../../../../assets/Azure_Public_Service_Icons/Icons/Integration/10201-icon-service-Logic-Apps.svg'),
  virtualmachine:         require('../../../../assets/Azure_Public_Service_Icons/Icons/Compute/10021-icon-service-Virtual-Machine.svg'),
  // GCP services
  bigtable:               require('../../../../assets/google-cloud-icons/bigtable/bigtable.svg'),
  bigquery:               require('../../../../assets/google-cloud-icons/bigquery/bigquery.svg'),
  cloudcdn:               require('../../../../assets/google-cloud-icons/cloud_cdn/cloud_cdn.svg'),
  clouddns:               require('../../../../assets/google-cloud-icons/cloud_dns/cloud_dns.svg'),
  cloudinterconnect:      require('../../../../assets/google-cloud-icons/cloud_interconnect/cloud_interconnect.svg'),
  cloudloadbalancing:     require('../../../../assets/google-cloud-icons/cloud_load_balancing/cloud_load_balancing.svg'),
  cloudsql:               require('../../../../assets/google-cloud-icons/cloud_sql/cloud_sql.svg'),
  cloudstorage:           require('../../../../assets/google-cloud-icons/cloud_storage/cloud_storage.svg'),
  datalab:                require('../../../../assets/google-cloud-icons/datalab/datalab.svg'),
  dataproc:               require('../../../../assets/google-cloud-icons/dataproc/dataproc.svg'),
  googleiam:              require('../../../../assets/google-cloud-icons/identity_and_access_management/identity_and_access_management.svg'),
  googlesecurity:         require('../../../../assets/google-cloud-icons/security/security.svg'),
  googlevpc:              require('../../../../assets/google-cloud-icons/virtual_private_cloud/virtual_private_cloud.svg'),
  pubsub:                 require('../../../../assets/google-cloud-icons/pubsub/pubsub.svg'),
  securityscanner:        require('../../../../assets/google-cloud-icons/cloud_security_scanner/cloud_security_scanner.svg'),
  stackdriver:            require('../../../../assets/google-cloud-icons/stackdriver/stackdriver.svg'),
  visionapi:              require('../../../../assets/google-cloud-icons/cloud_vision_api/cloud_vision_api.svg'),
}

export default {
  name: "Participant",
  props: {
    entity: {
      type: Object,
      required: true
    },
  },
  data() {
    return {
      color: undefined
    }
  },
  mounted() {
    this.updateFontColor();
  },
  updated() {
    this.updateFontColor();
  },
  computed: {
    selected () {
      return this.$store.state.selected.includes(this.entity.name)
    },
    stereotype () {
      return this.entity.stereotype
    },
    comment() {
      return this.entity.comment
    },
    icon() {
      return iconPath[this.entity.type?.toLowerCase()]
    },
    backgroundColor() {
      // Returning `undefined` so that background-color is not set at all in the style attribute
      try {
        if (!this.entity.color) {
          return undefined;
        }
        // TODO: review this decision later; tinycolor2 should be considered as recommended by openai
        // Remove alpha for such a case:
        // 1. Background color for parent has low brightness (e.g. #000)
        // 2. Alpha is low (e.g. 0.1)
        // 3. Entity background has high brightness (e.g. #fff)
        // If we do not remove alpha, the computed background color will be bright while the perceived brightness is low.
        // This will cause issue when calculating font color.
        return this.entity.color && removeAlpha(this.entity.color);
      } catch (e) {
        return undefined;
      }
    },
  },
  methods: {
    onSelect () {
      this.$store.commit('onSelect', this.entity.name)
    },
    updateFontColor () {
      // Returning `undefined` so that background-color is not set at all in the style attribute
      if (!this.backgroundColor) {
        return undefined;
      }
      let bgColor = window.getComputedStyle(this.$refs.participant).getPropertyValue('background-color');
      if (!bgColor) {
        return undefined;
      }
      let b = brightnessIgnoreAlpha(bgColor);
      this.color = b > 128 ? '#000' : '#fff';
    }
  }
}
</script>

<style scoped>

</style>
