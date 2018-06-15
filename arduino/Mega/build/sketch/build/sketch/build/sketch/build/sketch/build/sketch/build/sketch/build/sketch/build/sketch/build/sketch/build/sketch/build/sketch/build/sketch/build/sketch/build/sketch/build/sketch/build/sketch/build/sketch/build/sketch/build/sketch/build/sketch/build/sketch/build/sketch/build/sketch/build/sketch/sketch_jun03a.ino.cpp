#include <Arduino.h>
#line 1 "/Users/im-untaek/Documents/Arduino/sketch_jun03a/sketch_jun03a.ino"
#line 1 "/Users/im-untaek/Documents/Arduino/sketch_jun03a/sketch_jun03a.ino"
#include <HX711.h>
#include <Servo.h>

#define GET_SENSORVALUE 1
#define CONTROL_MEAL 2
#define CONTROL_WATER 3

int id = 12050054;

long currentMillis = millis();
long prevMillis = currentMillis;

Servo servo;
int servoPin = 12;
int angle = 0;

int pumpPin = 44;
int relayPin = 11;

HX711 scale1;
HX711 scale2;

int meal;
int water;

void initiateHX711(HX711 &scale, int a1, int a2, float cal) {
  scale.begin(a1, a2);
  Serial.println("Initializing the scale");

  scale.set_scale(cal);
  scale.tare();
}

void readWeight(HX711 scale, String name, int &target) {
  target = scale.get_units(10);
  Serial.println(name + " average:\t" + target);
}

void controlMeal(int target){
  if (meal > target) {
    servo.write(0);
  }
  else {
    servo.write(180);
  }
}

void controlWater(int target){
  if(water > target) {
    digitalWrite(pumpPin, HIGH);
    digitalWrite(pumpPin, LOW);
  }
  else {
    digitalWrite(pumpPin, LOW);
    digitalWrite(pumpPin, HIGH);
  }
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);
  pinMode(44, OUTPUT);
  pinMode(relayPin, OUTPUT);
  servo.attach(servoPin);
  servo.write(0);
  initiateHX711(scale1, A1, A0, 570.0f);
  initiateHX711(scale2, A3, A2, 520.0f);
}

void loop() {
  // put your main code here, to run repeatedly:
  currentMillis = millis();

  if(currentMillis > prevMillis + 2000){
    prevMillis = currentMillis;
    readWeight(scale1, "meal", meal);
    delay(300);
    readWeight(scale2, "water", water);
  
    scale1.power_down();
    scale2.power_down();
    scale1.power_up();
    scale2.power_up();
  }
  delay(1000);
  digitalWrite(relayPin, LOW);
  delay(1000);
  digitalWrite(relayPin, LOW);
  controlMeal(100);
  controlWater(100);

  if(Serial1.available()) {
    int code = Serial1.read();
    
  }
  Serial1.write(meal);
}
