(ns jenq
  (:use [domina :only [remove-class! add-class! by-id value append!]]
        [domina.events :only [listen!]])
  (:require [goog.net.Jsonp :as jsonp]))

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
  (let [hash (-> window.location
                 (.toString ())
                 (.split "#")
                 (get 1))]
    
    (if hash
      (zipmap [:url]
              (map decode (next (.split hash "/"))))
      {})))

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

(defn job-class [status]
  (get {"blue" "pass"
        "red" "fail"
        "yellow" "amber"
        "disabled" "disabled"}
       status "unknown"))

(defn add-job [{name :name color :color url :url}]
  (let [job-box (append! (by-id "jobs")
                         (str "<div class=\"job " (job-class color) "\">"
                              "<a target=\"_blank\" href=\"" url "\">" name "</a></div>"))]))

(defn count-passes [jobs]
  (count (filter #(= "blue" %) (map :color jobs))))

(defn jobs-jsonp-cb [json-obj]
  (let [data (js->clj json-obj :keywordize-keys true)]
    (doall (map add-job (:jobs data)))
    (set! document.title (str "Jenq :: "
                              (count-passes (:jobs data))
                              "/"
                              (count (:jobs data))))))

(defn jenkins-jobs-jsonp [url]
  (.send (goog.net.Jsonp. url "jsonp")
         "" jobs-jsonp-cb log))

(defn load-jenkins-jobs [baseurl]
  (log (str "Loading from " baseurl))
  (jenkins-jobs-jsonp (str baseurl "/api/json")))


;; let's go!

(defn start-jenq []
  (log "Hello from the jenq")
  (add-listeners)
  (if (:url (parse-hash))
    (load-jenkins-jobs (:url (parse-hash)))
    (show-jenkins-finder)))

(start-jenq)