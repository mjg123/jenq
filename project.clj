(defproject jenq "0.1.0-SNAPSHOT"
  :description "Jenq"
  :url "http://github.com/mjg123/jenq"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}

  :dependencies [[org.clojure/clojure "1.4.0"]
                 [domina "1.0.0-beta4"]]
  :plugins [[lein-cljsbuild "0.2.1"]]
  
  :cljsbuild {
              :builds [{
                        :source-path "src"
                        :compiler {
                                   :output-to "out/jenq.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]})
