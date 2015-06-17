# simple build process using google closure compile
java -jar compiler.jar --version

#versioning system consists of editing numbers in file name in last line
java -jar compiler.jar \
--js=../src/Graph.js \
--js=../src/Peak.js \
--js=../src/Annotation.js \
--js_output_file=./spectrum.js;
