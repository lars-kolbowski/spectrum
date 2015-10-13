# simple build process using google closure compile
java -jar compiler.jar --version

#versioning system consists of editing numbers in file name in last line
java -jar compiler.jar \
--js=../src/SpectrumViewer.js \
--js=../src/FragmentationKey.js \
--js=../src/graph/Graph.js \
--js=../src/graph/Peak.js \
--js=../src/graph/Fragment.js \
--js_output_file=./spectrum.js;
