from kafka import KafkaConsumer
consumer = KafkaConsumer('process.payload', bootstrap_servers='localhost:9091')
for msg in consumer:
  print (msg.value.decode('utf-8'))
