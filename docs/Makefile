default:
	@gem install jekyll bundler && bundle install

update:
	@bundle update

clean:
	@bundle exec jekyll clean

build: clean
	@bundle exec jekyll build --profile --config _config.yml,.debug.yml

server: clean
	@bundle exec jekyll server --livereload --config _config.yml,.debug.yml
