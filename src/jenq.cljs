(ns jenq
  (:use [domina :only [remove-class! add-class! by-id value]]
        [domina.events :only [listen!]]))

(defn log [msg] (.log js/console msg))
(def encode (aget js/window "encodeURIComponent"))
(def decode (aget js/window "decodeURIComponent"))

;; Event listeners

(defn add-listeners []
  (listen! (by-id "load-jenk") :click load-jenkins-cb))



;; Hash-bang shennanigans

(defn parse-hash
  "assumes a url like .../jenq.html/#/http://jenkins:9000/"
  []
  (let [hash (subs (.toString window.location.hash ()) 1)
        parts (next (.split hash "/"))]
    (zipmap [:url] (map decode parts))))

(defn set-hash! [jenkins-url]
  (let [hash (str "#LEEROY!/" (encode jenkins-url))]
    (set! window.location.hash hash)))



;; Jenkins finder

(defn show-jenkins-finder []
  (remove-class! (by-id "jenkins-finder") "invisible"))

(defn hide-jenkins-finder []
  (add-class! (by-id "jenkins-finder") "invisible"))

(defn load-jenkins-cb []
  (let [url (value (by-id "jenkins-url"))]
    (set-hash! url)
    (hide-jenkins-finder)
    (load-jenkins-jobs url)))



;; Jenkins job loader

(defn load-jenkins-jobs [baseurl]
  (log (str "Loading from " baseurl)))


;; let's go!

(defn start-jenq []
  (log "Hello from the jenq")
  (add-listeners)
  (if (:url (parse-hash))
    (load-jenkins-jobs (:url (parse-hash)))
    (show-jenkins-finder)))


(start-jenq)