import actor from '../../../assets/actor.svg?raw';
import boundary from '../../../assets/Robustness_Diagram_Boundary.svg?raw';
import control from '../../../assets/Robustness_Diagram_Control.svg?raw';
import database from '../../../assets/database.svg?raw';
import entity from '../../../assets/Robustness_Diagram_Entity.svg?raw';
// AWS
import cloudwatch from '../../../assets/Architecture-Service-Icons_09172021/Arch_Management-Governance/16/Arch_Amazon-CloudWatch_16.svg?raw';
import cloudfront from '../../../assets/Architecture-Service-Icons_09172021/Arch_Networking-Content-Delivery/16/Arch_Amazon-CloudFront_16.svg?raw';
import cognito from '../../../assets/Architecture-Service-Icons_09172021/Arch_Security-Identity-Compliance/16/Arch_Amazon-Cognito_16.svg?raw';
import dynamodb from '../../../assets/Architecture-Service-Icons_09172021/Arch_Database/16/Arch_Amazon-DynamoDB_16.svg?raw';
import ebs from '../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Elastic-Block-Store_16.svg?raw';
import ec2 from '../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_Amazon-EC2_16.svg?raw';
import ecs from '../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_Amazon-Elastic-Container-Service_16.svg?raw';
import efs from '../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Elastic-File-System_16.svg?raw';
import elasticache from '../../../assets/Architecture-Service-Icons_09172021/Arch_Database/16/Arch_Amazon-ElastiCache_16.svg?raw';
import elasticbeantalk from '../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_AWS-Elastic-Beanstalk_16.svg?raw';
import elasticfilesystem from '../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Elastic-File-System_16.svg?raw';
import glacier from '../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Simple-Storage-Service-Glacier_16.svg?raw';
import iam from '../../../assets/Architecture-Service-Icons_09172021/Arch_Security-Identity-Compliance/16/Arch_AWS-Identity-and-Access-Management_16.svg?raw';
import kinesis from '../../../assets/Architecture-Service-Icons_09172021/Arch_Analytics/Arch_16/Arch_Amazon-Kinesis_16.svg?raw';
import lambda from '../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_AWS-Lambda_16.svg?raw';
import lightsail from '../../../assets/Architecture-Service-Icons_09172021/Arch_Compute/16/Arch_Amazon-Lightsail_16.svg?raw';
import rds from '../../../assets/Architecture-Service-Icons_09172021/Arch_Database/16/Arch_Amazon-RDS_16.svg?raw';
import redshift from '../../../assets/Architecture-Service-Icons_09172021/Arch_Analytics/Arch_16/Arch_Amazon-Redshift_16.svg?raw';
import s3 from '../../../assets/Architecture-Service-Icons_09172021/Arch_Storage/16/Arch_Amazon-Simple-Storage-Service_16.svg?raw';
import sns from '../../../assets/Architecture-Service-Icons_09172021/Arch_App-Integration/Arch_16/Arch_Amazon-Simple-Notification-Service_16.svg?raw';
import sqs from '../../../assets/Architecture-Service-Icons_09172021/Arch_App-Integration/Arch_16/Arch_Amazon-Simple-Queue-Service_16.svg?raw';
import sagemaker from '../../../assets/Architecture-Service-Icons_09172021/Arch_Machine-Learning/16/Arch_Amazon-SageMaker_16.svg?raw';
import vpc from '../../../assets/Architecture-Service-Icons_09172021/Arch_Networking-Content-Delivery/16/Arch_Amazon-Virtual-Private-Cloud_16.svg?raw';
// Azure
import azureactivedirectory from '../../../assets/Azure_Public_Service_Icons/Icons/Identity/10221-icon-service-Azure-Active-Directory.svg?raw';
import azurebackup from '../../../assets/Azure_Public_Service_Icons/Icons/Azure Stack/10108-icon-service-Infrastructure-Backup.svg?raw';
import azurecdn from '../../../assets/Azure_Public_Service_Icons/Icons/App Services/00056-icon-service-CDN-Profiles.svg?raw';
import azuredatafactory from '../../../assets/Azure_Public_Service_Icons/Icons/Databases/10126-icon-service-Data-Factory.svg?raw';
import azuredevops from '../../../assets/Azure_Public_Service_Icons/Icons/DevOps/10261-icon-service-Azure-DevOps.svg?raw';
import azurefunction from '../../../assets/Azure_Public_Service_Icons/Icons/Compute/10029-icon-service-Function-Apps.svg?raw';
import azuresql from '../../../assets/Azure_Public_Service_Icons/Icons/Databases/02390-icon-service-Azure-SQL.svg?raw';
import cosmosdb from '../../../assets/Azure_Public_Service_Icons/Icons/Databases/10121-icon-service-Azure-Cosmos-DB.svg?raw';
import logicapps from '../../../assets/Azure_Public_Service_Icons/Icons/Integration/10201-icon-service-Logic-Apps.svg?raw';
import virtualmachine from '../../../assets/Azure_Public_Service_Icons/Icons/Compute/10021-icon-service-Virtual-Machine.svg?raw';
// GCP
import bigtable from '../../../assets/google-cloud-icons/bigtable/bigtable.svg?raw';
import bigquery from '../../../assets/google-cloud-icons/bigquery/bigquery.svg?raw';
import cloudcdn from '../../../assets/google-cloud-icons/cloud_cdn/cloud_cdn.svg?raw';
import clouddns from '../../../assets/google-cloud-icons/cloud_dns/cloud_dns.svg?raw';
import cloudinterconnect from '../../../assets/google-cloud-icons/cloud_interconnect/cloud_interconnect.svg?raw';
import cloudloadbalancing from '../../../assets/google-cloud-icons/cloud_load_balancing/cloud_load_balancing.svg?raw';
import cloudsql from '../../../assets/google-cloud-icons/cloud_sql/cloud_sql.svg?raw';
import cloudstorage from '../../../assets/google-cloud-icons/cloud_storage/cloud_storage.svg?raw';
import datalab from '../../../assets/google-cloud-icons/datalab/datalab.svg?raw';
import dataproc from '../../../assets/google-cloud-icons/dataproc/dataproc.svg?raw';
import googleiam from '../../../assets/google-cloud-icons/identity_and_access_management/identity_and_access_management.svg?raw';
import googlesecurity from '../../../assets/google-cloud-icons/security/security.svg?raw';
import googlevpc from '../../../assets/google-cloud-icons/virtual_private_cloud/virtual_private_cloud.svg?raw';
import pubsub from '../../../assets/google-cloud-icons/pubsub/pubsub.svg?raw';
import securityscanner from '../../../assets/google-cloud-icons/cloud_security_scanner/cloud_security_scanner.svg?raw';
import stackdriver from '../../../assets/google-cloud-icons/stackdriver/stackdriver.svg?raw';
import visionapi from '../../../assets/google-cloud-icons/cloud_vision_api/cloud_vision_api.svg?raw';

export default {
  actor,
  boundary,
  control,
  database,
  entity,
  cloudwatch,
  cloudfront,
  cognito,
  dynamodb,
  ebs,
  ec2,
  ecs,
  efs,
  elasticache,
  elasticbeantalk,
  elasticfilesystem,
  glacier,
  iam,
  kinesis,
  lambda,
  lightsail,
  rds,
  redshift,
  s3,
  sns,
  sqs,
  sagemaker,
  vpc,
  azureactivedirectory,
  azurebackup,
  azurecdn,
  azuredatafactory,
  azuredevops,
  azurefunction,
  azuresql,
  cosmosdb,
  logicapps,
  virtualmachine,
  bigtable,
  bigquery,
  cloudcdn,
  clouddns,
  cloudinterconnect,
  cloudloadbalancing,
  cloudsql,
  cloudstorage,
  datalab,
  dataproc,
  googleiam,
  googlesecurity,
  googlevpc,
  pubsub,
  securityscanner,
  stackdriver,
  visionapi,
};
