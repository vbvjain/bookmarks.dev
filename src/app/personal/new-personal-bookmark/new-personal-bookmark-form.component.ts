import {Component, OnInit} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {KeycloakService} from '../../core/keycloak/keycloak.service';
import {PersonalBookmarksStore} from '../store/PersonalBookmarksStore';
import {Router} from '@angular/router';
import {BookmarkService} from '../../public/bookmark/bookmark.service';
import {MarkdownService} from '../markdown.service';

@Component({
  selector: 'new-personal-bookmark-form',
  templateUrl: './new-personal-bookmark-form.component.html'
})
export class NewPersonalBookmarkFormComponent implements OnInit {

  model = new Bookmark('', '', 'en', '', [], null, '', '',  '' );
  bookmarkForm: FormGroup;
  userId = null;

  constructor(
    private personalBookmarksStore: PersonalBookmarksStore,
    private router: Router,
    private formBuilder: FormBuilder,
    private keycloakService: KeycloakService,
    private bookmarkService: BookmarkService,
    private markdownServce: MarkdownService
  ) {
    const keycloak = keycloakService.getKeycloak();
    if (keycloak) {
      this.userId = keycloak.subject;
    }
  }

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm(): void {
    this.bookmarkForm = this.formBuilder.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      tagsLine: ['', Validators.required],
      publishedOn: null,
      githubURL: '',
      description: '',
      shared: false,
      language: 'en'
    });

    this.bookmarkForm.controls['location'].valueChanges
      .debounceTime(400)
      .distinctUntilChanged()
      .subscribe(location => {
        console.log('Location: ', location);
        this.bookmarkService.getBookmarkTitle(location).subscribe(response => {
          if (response) {
            this.bookmarkForm.controls['name'].patchValue(response.title, {emitEvent : false});
          }
        });
      });
  }

  saveBookmark(model: Bookmark) {
    model.tags = model.tagsLine.split(',').map(function(item) {
      return item.trim().replace(' ', '-'); // replace spaces between words (if any) in a tag with dashes
    });

    const newBookmark = new Bookmark(model.name, model.location, model.language, model.category, model.tags, model.publishedOn, model.githubURL, model.description, null);

    newBookmark.userId = this.userId;
    newBookmark.shared = model.shared;

    newBookmark.descriptionHtml = this.markdownServce.toHtml(newBookmark.description);

    const obs = this.personalBookmarksStore.addBookmark(this.userId, newBookmark);

    obs.subscribe(
      res => {
        console.log(res);
        this.router.navigate(['/personal']);
      });
  }
}