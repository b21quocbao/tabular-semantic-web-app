from kafka import KafkaConsumer, KafkaProducer
consumer = KafkaConsumer('process.payload', bootstrap_servers='localhost:9091', group_id='my-group')
producer = KafkaProducer(bootstrap_servers='localhost:9091')
for msg in consumer:
  print(msg.value.decode('utf-8'))
  producer.send('process.payload.reply', str.encode('hello ' + msg.value.decode('utf-8')))
