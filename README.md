HTTP server that receives POST requests from Meraki dashboard
Webhook endpoint specifically for Meraki alerts (/webhook/meraki)
JSON payload parsing and validation
Basic alert logging and storage
Proper HTTP response handling for Meraki confirmation
Error handling for malformed requests
Basic alert filtering and categorization
Validate Webhook Signature. This is a security feature. When enabled, it makes sure that the alerts are actually coming from your Meraki dashboard and not from someone else trying to send fake alerts. Meraki can include a special "signature" with each alert to prove it's really from them.
