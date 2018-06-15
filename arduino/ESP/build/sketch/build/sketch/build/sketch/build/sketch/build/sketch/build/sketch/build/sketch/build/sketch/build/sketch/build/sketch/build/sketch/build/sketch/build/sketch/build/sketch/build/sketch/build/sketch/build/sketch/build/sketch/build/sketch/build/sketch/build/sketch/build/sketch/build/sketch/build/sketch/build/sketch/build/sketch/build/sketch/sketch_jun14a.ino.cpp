#include <Arduino.h>
#line 1 "/Users/im-untaek/Documents/Arduino/sketch_jun14a/sketch_jun14a.ino"
#line 1 "/Users/im-untaek/Documents/Arduino/sketch_jun14a/sketch_jun14a.ino"
#include <EEPROM.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define GET_SENSORVALUE 1
#define CONTROL_MEAL 2
#define CONTROL_WATER 3

struct Data {
  String device_id;
  String sensor_type;
  int measured_value;
};

#define DATALEN sizeof(struct Data)

static struct Data sensorData;
static struct Data targetData;

const char* ssid = "409LAB-2";
const char* password = "409bigdata";
const char* mqttserver = "192.168.0.6";

// Temporary Serial number
const char* device_id = "931124";
const char* topic_sensor = String("sensor-" + String(device_id)).c_str();
const char* topic_target = String("target-" + String(device_id)).c_str();
const char* topic_identification = "identification";

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;

long currentMillis = millis();
long pulled = currentMillis;

char buf[200];

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Data data;
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  memcpy_P(&targetData, payload, DATALEN);
  // send target value to sensor machine
  Serial.write(payload, length);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(device_id)) {
      Serial.println("connected");
      
      // publish / subscribe
      client.publish(topic_identification, device_id);
      client.subscribe(topic_target);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}


void setup() {
  pinMode(BUILTIN_LED, OUTPUT);
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqttserver, 1883);
  client.setCallback(callback);

  EEPROM.put(0, device_id);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // publish every 60s
  if(currentMillis - pulled > 60000){
    pulled = currentMillis;
    client.publish(topic_sensor, (char *)&sensorData);
  }

  // reveive sensor data from Mega
  if(Serial.available()) {
    const char* packet = Serial.readString().c_str();
    Serial.println(packet);
    client.publish(topic_sensor, packet;
  }
}

